import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validatePassword } from "@/lib/validate-password";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { forceIpv4Outbound } from "@/lib/force-ipv4";

void forceIpv4Outbound();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Change the signed-in admin's password.
 * Verifies the current password server-side via signInWithPassword before
 * applying the new password with the service role — never trusts the client alone.
 */
export async function POST(request: NextRequest) {
  // Throttle current-password guessing (the route calls signInWithPassword to
  // verify the current password before applying the new one).
  const ipLimited = await rateLimit(`admin-pw-change-ip:${clientIp(request)}`, {
    limit: 10,
    windowMs: 15 * 60_000,
  });
  if (!ipLimited.ok) return rateLimitResponse(ipLimited.retryAfterSec);

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
  if (userError || !userData?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: adminRow } = await supabaseAdmin
    .from("admin_users")
    .select("id, is_active")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (!adminRow?.is_active) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Per-account throttle on top of the per-IP one above.
  const userLimited = await rateLimit(`admin-pw-change:${userData.user.id}`, {
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (!userLimited.ok) return rateLimitResponse(userLimited.retryAfterSec);

  let body: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    captchaToken?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");
  const captchaToken =
    typeof body.captchaToken === "string" && body.captchaToken ? body.captchaToken : undefined;

  if (!currentPassword) {
    return NextResponse.json({ error: "Current password is required." }, { status: 400 });
  }

  const policyError = validatePassword(newPassword);
  if (policyError) {
    return NextResponse.json({ error: policyError }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "New password must be different from the current password." },
      { status: 400 }
    );
  }

  // Verify current password against Supabase Auth (server-side).
  const verifier = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: userData.user.email,
    password: currentPassword,
    ...(captchaToken ? { options: { captchaToken } } : {}),
  });
  // Discard the verifier session immediately — we only needed the credential check.
  await verifier.auth.signOut().catch(() => {});

  if (verifyError) {
    if (verifyError.message.toLowerCase().includes("captcha")) {
      return NextResponse.json(
        { error: "Please complete the security check and try again." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
    password: newPassword,
  });

  if (updateError) {
    return apiErrorResponse(updateError, 500, "admin/account/change-password");
  }

  return NextResponse.json({ ok: true });
}
