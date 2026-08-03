/**
 * Local-only helpers for auth hardening E2E tests.
 * Uses the service role from .env.local — never commit secrets.
 */
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

function base32ToBuffer(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = String(secret).replace(/=+$/, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";
  for (const c of cleaned) {
    const val = alphabet.indexOf(c);
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTotp(secret, forTime = Date.now()) {
  const key = base32ToBuffer(secret);
  const counter = Math.floor(forTime / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter & 0xffffffff, 4);
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envText = readFileSync(envPath, "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

export const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});
export const anonClient = createClient(url, anon, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Optional local-only harness. Set AUTH_TEST_* emails via env when needed —
// do not hardcode disposable Auth users into the repo.
export const TEST_CUSTOMER_EMAIL = process.env.AUTH_TEST_CUSTOMER_EMAIL || "";
export const TEST_CUSTOMER_PASSWORD_INITIAL =
  process.env.AUTH_TEST_CUSTOMER_PASSWORD || "ResetTest1_@abc";
export const TEST_CUSTOMER_PASSWORD_NEW =
  process.env.AUTH_TEST_CUSTOMER_PASSWORD_NEW || "ResetTest2_@xyz";

export const TEST_ADMIN_EMAIL = process.env.AUTH_TEST_ADMIN_EMAIL || "";
export const TEST_ADMIN_PASSWORD_A =
  process.env.AUTH_TEST_ADMIN_PASSWORD || "AdminTest1_@abc";
export const TEST_ADMIN_PASSWORD_B =
  process.env.AUTH_TEST_ADMIN_PASSWORD_B || "AdminTest2_@xyz";
export const BASE = process.env.AUTH_TEST_BASE || "http://localhost:3002";

function requireTestEmail(email, envName) {
  if (!email) {
    console.error(`Set ${envName} before running this helper command.`);
    process.exit(1);
  }
}

const cmd = process.argv[2];

if (cmd === "ensure-customer") {
  requireTestEmail(TEST_CUSTOMER_EMAIL, "AUTH_TEST_CUSTOMER_EMAIL");
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = listed?.users?.find((u) => u.email === TEST_CUSTOMER_EMAIL);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_CUSTOMER_EMAIL,
      password: TEST_CUSTOMER_PASSWORD_INITIAL,
      email_confirm: true,
    });
    if (error) {
      console.error("createUser failed", error);
      process.exit(1);
    }
    user = data.user;
    console.log("created user", user.id);
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: TEST_CUSTOMER_PASSWORD_INITIAL,
      email_confirm: true,
    });
    if (error) {
      console.error("reset initial password failed", error);
      process.exit(1);
    }
    console.log("reused user", user.id, "(password reset to initial)");
  }

  const { data: existing } = await admin
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!existing) {
    const { error } = await admin.from("customers").insert({
      auth_user_id: user.id,
      email: TEST_CUSTOMER_EMAIL,
      full_name: "Auth Reset Test",
      phone: "03001234567",
      referral_code: `TST${String(user.id).replace(/-/g, "").slice(0, 8).toUpperCase()}`,
    });
    if (error) console.warn("customers insert skipped/failed:", error.message);
  }

  console.log(
    JSON.stringify({
      email: TEST_CUSTOMER_EMAIL,
      password: TEST_CUSTOMER_PASSWORD_INITIAL,
      userId: user.id,
    })
  );
} else if (cmd === "recovery-link") {
  requireTestEmail(TEST_CUSTOMER_EMAIL, "AUTH_TEST_CUSTOMER_EMAIL");
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: TEST_CUSTOMER_EMAIL,
    options: {
      redirectTo: process.argv[3] || "http://localhost:3001/reset-password",
    },
  });
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(
    JSON.stringify(
      {
        action_link: data.properties?.action_link,
        hashed_token: data.properties?.hashed_token,
        email: TEST_CUSTOMER_EMAIL,
        newPassword: TEST_CUSTOMER_PASSWORD_NEW,
      },
      null,
      2
    )
  );
} else if (cmd === "login-check") {
  requireTestEmail(TEST_CUSTOMER_EMAIL, "AUTH_TEST_CUSTOMER_EMAIL");
  const password = process.argv[3] || TEST_CUSTOMER_PASSWORD_NEW;
  const { data, error } = await anonClient.auth.signInWithPassword({
    email: TEST_CUSTOMER_EMAIL,
    password,
  });
  if (error) {
    console.error("LOGIN_FAIL", error.message);
    process.exit(1);
  }
  console.log("LOGIN_OK", data.user?.id);
  await anonClient.auth.signOut();
} else if (cmd === "request-reset") {
  requireTestEmail(TEST_CUSTOMER_EMAIL, "AUTH_TEST_CUSTOMER_EMAIL");
  const { data, error } = await anonClient.auth.resetPasswordForEmail(TEST_CUSTOMER_EMAIL, {
    redirectTo: process.argv[3] || "http://localhost:3001/reset-password",
  });
  console.log(JSON.stringify({ data, error }, null, 2));
} else if (cmd === "ensure-admin") {
  requireTestEmail(TEST_ADMIN_EMAIL, "AUTH_TEST_ADMIN_EMAIL");
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = listed?.users?.find((u) => u.email === TEST_ADMIN_EMAIL);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD_A,
      email_confirm: true,
    });
    if (error) {
      console.error(error);
      process.exit(1);
    }
    user = data.user;
    console.log("created admin auth user", user.id);
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: TEST_ADMIN_PASSWORD_A,
      email_confirm: true,
    });
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log("reset admin password to A", user.id);
  }
  const { data: existing } = await admin
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!existing) {
    const { error } = await admin.from("admin_users").insert({
      auth_user_id: user.id,
      email: TEST_ADMIN_EMAIL,
      name: "Auth Admin Test",
      role: "admin",
      is_active: true,
    });
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log("created admin_users row");
  }
  console.log(JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD_A, userId: user.id }));
} else if (cmd === "test-admin-password-change") {
  requireTestEmail(TEST_ADMIN_EMAIL, "AUTH_TEST_ADMIN_EMAIL");
  const { data: login, error: loginErr } = await anonClient.auth.signInWithPassword({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD_A,
  });
  if (loginErr) {
    console.error("login failed", loginErr.message);
    process.exit(1);
  }
  const token = login.session.access_token;
  async function callChange(currentPassword, newPassword, confirmPassword) {
    const res = await fetch(`${BASE}/api/admin/account/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    return { status: res.status, json: await res.json().catch(() => ({})) };
  }
  const wrong = await callChange("WrongPass1_@xxx", TEST_ADMIN_PASSWORD_B, TEST_ADMIN_PASSWORD_B);
  console.log("WRONG_CURRENT", JSON.stringify(wrong));
  const ok = await callChange(TEST_ADMIN_PASSWORD_A, TEST_ADMIN_PASSWORD_B, TEST_ADMIN_PASSWORD_B);
  console.log("CHANGE_OK", JSON.stringify(ok));
  await anonClient.auth.signOut();
  const oldTry = await anonClient.auth.signInWithPassword({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD_A,
  });
  console.log("OLD_PASSWORD", oldTry.error ? `FAIL_AS_EXPECTED:${oldTry.error.message}` : "UNEXPECTED_OK");
  const newTry = await anonClient.auth.signInWithPassword({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD_B,
  });
  console.log("NEW_PASSWORD", newTry.error ? `FAIL:${newTry.error.message}` : `OK:${newTry.data.user.id}`);
  // Restore A so later MFA tests have a known password.
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const user = listed.data?.users?.find((u) => u.email === TEST_ADMIN_EMAIL);
  if (user) await admin.auth.admin.updateUserById(user.id, { password: TEST_ADMIN_PASSWORD_A });
  console.log("restored PASSWORD_A");
  await anonClient.auth.signOut();
} else if (cmd === "test-admin-mfa") {
  requireTestEmail(TEST_ADMIN_EMAIL, "AUTH_TEST_ADMIN_EMAIL");
  // Full MFA cycle on the dedicated test admin: enroll → login challenge → disable.
  await anonClient.auth.signOut().catch(() => {});
  const { data: login, error: loginErr } = await anonClient.auth.signInWithPassword({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD_A,
  });
  if (loginErr) {
    console.error("login failed", loginErr.message);
    process.exit(1);
  }

  // Clean any leftover factors from prior runs.
  const { data: existingFactors } = await anonClient.auth.mfa.listFactors();
  for (const f of existingFactors?.all || []) {
    await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: login.user.id });
  }

  const { data: enrolled, error: enrollErr } = await anonClient.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "E2E Test Authenticator",
  });
  if (enrollErr) {
    console.error("enroll failed", enrollErr);
    process.exit(1);
  }
  const secret = enrolled.totp.secret;
  const factorId = enrolled.id;
  console.log("ENROLLED", factorId);

  const code1 = generateTotp(secret);
  const { data: ch1, error: ch1Err } = await anonClient.auth.mfa.challenge({ factorId });
  if (ch1Err) {
    console.error("challenge1 failed", ch1Err);
    process.exit(1);
  }
  const { error: v1Err } = await anonClient.auth.mfa.verify({
    factorId,
    challengeId: ch1.id,
    code: code1,
  });
  if (v1Err) {
    // Clock skew: try previous/next window
    for (const delta of [-30000, 30000]) {
      const alt = generateTotp(secret, Date.now() + delta);
      const { data: chAlt } = await anonClient.auth.mfa.challenge({ factorId });
      const { error: altErr } = await anonClient.auth.mfa.verify({
        factorId,
        challengeId: chAlt.id,
        code: alt,
      });
      if (!altErr) {
        console.log("VERIFY_ENROLL_OK (skew)", alt);
        break;
      }
      if (delta === 30000) {
        console.error("verify enroll failed", v1Err);
        process.exit(1);
      }
    }
  } else {
    console.log("VERIFY_ENROLL_OK", code1);
  }

  await anonClient.auth.signOut();

  // Password login should leave us at aal1 with nextLevel aal2
  const { data: login2, error: login2Err } = await anonClient.auth.signInWithPassword({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD_A,
  });
  if (login2Err) {
    console.error("re-login failed", login2Err);
    process.exit(1);
  }
  const { data: aal } = await anonClient.auth.mfa.getAuthenticatorAssuranceLevel();
  console.log("AAL_AFTER_PASSWORD", aal);

  const code2 = generateTotp(secret);
  const { data: ch2, error: ch2Err } = await anonClient.auth.mfa.challenge({ factorId });
  if (ch2Err) {
    console.error("challenge2 failed", ch2Err);
    process.exit(1);
  }
  let verifiedLogin = false;
  const tryCodes = [code2, generateTotp(secret, Date.now() - 30000), generateTotp(secret, Date.now() + 30000)];
  for (const code of tryCodes) {
    const { data: ch } = await anonClient.auth.mfa.challenge({ factorId });
    const { error } = await anonClient.auth.mfa.verify({
      factorId,
      challengeId: ch.id,
      code,
    });
    if (!error) {
      verifiedLogin = true;
      console.log("LOGIN_MFA_OK", code);
      break;
    }
  }
  if (!verifiedLogin) {
    console.error("LOGIN_MFA_FAIL");
    process.exit(1);
  }

  const { data: aal2 } = await anonClient.auth.mfa.getAuthenticatorAssuranceLevel();
  console.log("AAL_AFTER_TOTP", aal2);

  // Disable via API (password required)
  const token = (await anonClient.auth.getSession()).data.session.access_token;
  const res = await fetch(`${BASE}/api/admin/account/mfa-disable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword: TEST_ADMIN_PASSWORD_A, factorId }),
  });
  const json = await res.json().catch(() => ({}));
  console.log("DISABLE", res.status, JSON.stringify(json));

  await anonClient.auth.signOut();
  const { data: login3 } = await anonClient.auth.signInWithPassword({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD_A,
  });
  const { data: aal3 } = await anonClient.auth.mfa.getAuthenticatorAssuranceLevel();
  const { data: factorsAfter } = await anonClient.auth.mfa.listFactors();
  console.log("AFTER_DISABLE", {
    aal: aal3,
    verifiedTotp: (factorsAfter?.totp || []).filter((f) => f.status === "verified").length,
  });
  await anonClient.auth.signOut();
  if (res.status !== 200 || (factorsAfter?.totp || []).some((f) => f.status === "verified")) {
    process.exit(1);
  }
  console.log("MFA_E2E_PASS");
} else if (cmd === "test-password-policy") {
  // Mirrors lib/validate-password.ts — keep in sync when changing the rule.
  function validatePassword(password) {
    if (password.length < 8) return "Password must be at least 8 characters.";
    return null;
  }
  const normal = "MySecurePass123";
  const short = "short";
  console.log("reject_short", validatePassword(short));
  console.log("accept_normal", validatePassword(normal));
  if (validatePassword(short) == null || validatePassword(normal) != null) process.exit(1);

  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: TEST_CUSTOMER_EMAIL,
  });
  if (linkErr) {
    console.error(linkErr);
    process.exit(1);
  }
  const { error: otpErr } = await anonClient.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "recovery",
  });
  if (otpErr) {
    console.error(otpErr);
    process.exit(1);
  }
  const { error: updateErr } = await anonClient.auth.updateUser({ password: normal });
  if (updateErr) {
    console.error("UPDATE_FAIL", updateErr.message);
    process.exit(1);
  }
  await anonClient.auth.signOut();
  const { error: loginErr } = await anonClient.auth.signInWithPassword({
    email: TEST_CUSTOMER_EMAIL,
    password: normal,
  });
  console.log(loginErr ? "LOGIN_FAIL " + loginErr.message : "LOGIN_OK");
  await anonClient.auth.signOut();

  // Server-side admin change-password uses the same shared helper via Next.
  await ensureAdminPasswordA();
  const { data: adminLogin, error: adminLoginErr } = await anonClient.auth.signInWithPassword({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD_A,
  });
  if (adminLoginErr) {
    console.error(adminLoginErr);
    process.exit(1);
  }
  const token = adminLogin.session.access_token;
  const shortRes = await fetch(`${BASE}/api/admin/account/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      currentPassword: TEST_ADMIN_PASSWORD_A,
      newPassword: short,
      confirmPassword: short,
    }),
  });
  console.log("admin_api_short", shortRes.status, await shortRes.json());
  const okRes = await fetch(`${BASE}/api/admin/account/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      currentPassword: TEST_ADMIN_PASSWORD_A,
      newPassword: normal,
      confirmPassword: normal,
    }),
  });
  console.log("admin_api_normal", okRes.status, await okRes.json());
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const user = listed.data?.users?.find((u) => u.email === TEST_ADMIN_EMAIL);
  if (user) await admin.auth.admin.updateUserById(user.id, { password: TEST_ADMIN_PASSWORD_A });
  await anonClient.auth.signOut();
  if (shortRes.status === 400 && okRes.status === 200 && !loginErr) {
    console.log("PASSWORD_POLICY_PASS");
  } else {
    process.exit(1);
  }
} else if (cmd === "test-admin-forgot-password") {
  requireTestEmail(TEST_ADMIN_EMAIL, "AUTH_TEST_ADMIN_EMAIL");
  // Admin forgot-password E2E: reset while MFA enrolled → new password still requires TOTP.
  const NEW_PASS = "AdminResetPass99";
  await anonClient.auth.signOut().catch(() => {});

  // Ensure known password + clean factors, then enroll MFA.
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const user = listed.data?.users?.find((u) => u.email === TEST_ADMIN_EMAIL);
  if (!user) {
    console.error("admin missing — run ensure-admin first");
    process.exit(1);
  }
  await admin.auth.admin.updateUserById(user.id, { password: TEST_ADMIN_PASSWORD_A });
  const { data: existingFactors } = await admin.auth.admin.mfa.listFactors({ userId: user.id });
  for (const f of existingFactors?.factors || []) {
    await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: user.id });
  }

  const { data: login } = await anonClient.auth.signInWithPassword({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD_A,
  });
  const { data: enrolled, error: enrollErr } = await anonClient.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Admin Reset E2E",
  });
  if (enrollErr) {
    console.error(enrollErr);
    process.exit(1);
  }
  const secret = enrolled.totp.secret;
  const factorId = enrolled.id;
  let enrollOk = false;
  for (const delta of [0, -30000, 30000]) {
    const code = generateTotp(secret, Date.now() + delta);
    const { data: ch } = await anonClient.auth.mfa.challenge({ factorId });
    const { error } = await anonClient.auth.mfa.verify({
      factorId,
      challengeId: ch.id,
      code,
    });
    if (!error) {
      enrollOk = true;
      break;
    }
  }
  if (!enrollOk) {
    console.error("MFA enroll verify failed");
    process.exit(1);
  }
  console.log("MFA_ENROLLED", factorId);
  await anonClient.auth.signOut();

  // Same API the forgot-password page calls (generic success path).
  const { error: resetErr } = await anonClient.auth.resetPasswordForEmail(TEST_ADMIN_EMAIL, {
    redirectTo: `${BASE}/reset-password?next=admin`,
  });
  console.log("RESET_EMAIL_REQUEST", resetErr ? resetErr.message : "ok");

  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: TEST_ADMIN_EMAIL,
    options: { redirectTo: `${BASE}/reset-password?next=admin` },
  });
  if (linkErr) {
    console.error(linkErr);
    process.exit(1);
  }
  const { error: otpErr } = await anonClient.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "recovery",
  });
  if (otpErr) {
    console.error("otp", otpErr);
    process.exit(1);
  }

  // Recovery is AAL1; Supabase requires AAL2 to update password when MFA is on.
  const { data: aalRecovery } = await anonClient.auth.mfa.getAuthenticatorAssuranceLevel();
  console.log("AAL_AFTER_RECOVERY", aalRecovery);
  let resetMfaOk = false;
  for (const delta of [0, -30000, 30000]) {
    const code = generateTotp(secret, Date.now() + delta);
    const { data: ch } = await anonClient.auth.mfa.challenge({ factorId });
    const { error } = await anonClient.auth.mfa.verify({
      factorId,
      challengeId: ch.id,
      code,
    });
    if (!error) {
      resetMfaOk = true;
      break;
    }
  }
  if (!resetMfaOk) {
    console.error("MFA_DURING_RESET_FAIL");
    process.exit(1);
  }
  const { data: aalElevated } = await anonClient.auth.mfa.getAuthenticatorAssuranceLevel();
  console.log("AAL_AFTER_RESET_MFA", aalElevated);

  const { error: updateErr } = await anonClient.auth.updateUser({ password: NEW_PASS });
  if (updateErr) {
    console.error("update", updateErr);
    process.exit(1);
  }
  await anonClient.auth.signOut();
  console.log("PASSWORD_RESET_OK");

  const { data: login2, error: login2Err } = await anonClient.auth.signInWithPassword({
    email: TEST_ADMIN_EMAIL,
    password: NEW_PASS,
  });
  if (login2Err) {
    console.error("login after reset", login2Err);
    process.exit(1);
  }
  const { data: aal } = await anonClient.auth.mfa.getAuthenticatorAssuranceLevel();
  console.log("AAL_AFTER_PASSWORD_LOGIN", aal);
  const needsMfa = aal?.nextLevel === "aal2" && aal?.currentLevel !== "aal2";
  if (!needsMfa) {
    console.error("EXPECTED_MFA_CHALLENGE_MISSING");
    process.exit(1);
  }

  let mfaOk = false;
  for (const delta of [0, -30000, 30000]) {
    const code = generateTotp(secret, Date.now() + delta);
    const { data: ch } = await anonClient.auth.mfa.challenge({ factorId });
    const { error } = await anonClient.auth.mfa.verify({
      factorId,
      challengeId: ch.id,
      code,
    });
    if (!error) {
      mfaOk = true;
      break;
    }
  }
  if (!mfaOk) {
    console.error("MFA_AFTER_RESET_FAIL");
    process.exit(1);
  }
  const { data: aal2 } = await anonClient.auth.mfa.getAuthenticatorAssuranceLevel();
  console.log("AAL_AFTER_TOTP", aal2);

  // Cleanup: disable MFA, restore known password.
  await admin.auth.admin.mfa.deleteFactor({ id: factorId, userId: login2.user.id });
  await admin.auth.admin.updateUserById(login2.user.id, { password: TEST_ADMIN_PASSWORD_A });
  await anonClient.auth.signOut();
  console.log("ADMIN_FORGOT_PASSWORD_E2E_PASS");
} else {
  console.log(
    "Usage: ensure-customer | recovery-link | login-check | request-reset | ensure-admin | test-admin-password-change | test-admin-mfa | test-password-policy | test-admin-forgot-password"
  );
}

async function ensureAdminPasswordA() {
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const user = listed?.data?.users?.find((u) => u.email === TEST_ADMIN_EMAIL);
  if (user) await admin.auth.admin.updateUserById(user.id, { password: TEST_ADMIN_PASSWORD_A });
}
