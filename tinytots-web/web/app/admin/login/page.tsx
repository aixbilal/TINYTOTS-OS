"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // MFA challenge step (only shown when password login succeeds and a TOTP factor exists)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);

  async function ensureActiveAdmin(userId: string): Promise<boolean> {
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("id, is_active")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (!adminRow || !adminRow.is_active) {
      await supabase.auth.signOut();
      setServerError("This account does not have admin access.");
      return false;
    }
    return true;
  }

  async function finishLogin() {
    router.push("/admin");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setServerError("You're offline, please reconnect");
      return;
    }

    if (!email.trim() || !password) {
      setServerError("Please enter your email and password.");
      return;
    }
    if (!isValidEmail(email)) {
      setServerError(EMAIL_ERROR);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.session) {
        setServerError("Incorrect email or password.");
        setSubmitting(false);
        return;
      }

      if (!(await ensureActiveAdmin(data.session.user.id))) {
        setSubmitting(false);
        return;
      }

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const needsMfa = aal?.nextLevel === "aal2" && aal?.currentLevel !== "aal2";

      if (needsMfa) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp?.find((f) => f.status === "verified") || factors?.totp?.[0];
        if (!totp) {
          // Factors expected but missing — allow through rather than lock out.
          await finishLogin();
          return;
        }
        setMfaFactorId(totp.id);
        setSubmitting(false);
        return;
      }

      await finishLogin();
    } catch {
      setServerError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaFactorId) return;
    setServerError(null);
    setMfaVerifying(true);

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: mfaFactorId,
    });
    if (challengeError || !challenge) {
      setServerError(challengeError?.message || "Could not start 2FA challenge.");
      setMfaVerifying(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.id,
      code: mfaCode.trim(),
    });

    if (verifyError) {
      setServerError("Invalid authentication code. Please try again.");
      setMfaVerifying(false);
      return;
    }

    await finishLogin();
  }

  async function cancelMfa() {
    await supabase.auth.signOut();
    setMfaFactorId(null);
    setMfaCode("");
    setServerError(null);
  }

  const inputClass =
    "w-full border rounded-lg px-4 py-3 bg-surface-elevated text-text-primary font-body-md text-body-md border-border-default focus:border-brand-primary focus:outline-none transition-colors";

  if (mfaFactorId) {
    return (
      <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        <h1 className="font-display-md text-display-md text-text-primary mb-2">Two-factor authentication</h1>
        <p className="font-body-sm text-body-sm text-text-secondary mb-stack-sm">
          Enter the 6-digit code from your authenticator app to continue.
        </p>

        <form onSubmit={handleMfaVerify} noValidate className="flex flex-col gap-stack-sm">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            className={inputClass}
            autoFocus
          />

          <button
            type="submit"
            disabled={mfaVerifying || mfaCode.trim().length < 6}
            className="w-full py-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {mfaVerifying ? "Verifying..." : "Verify and continue"}
          </button>

          {serverError && (
            <p className="font-label-md text-label-md text-red-700 mt-1">{serverError}</p>
          )}

          <button
            type="button"
            onClick={cancelMfa}
            className="font-body-sm text-body-sm text-text-secondary hover:underline mt-1"
          >
            Back to login
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 className="font-display-md text-display-md text-text-primary mb-stack-md">Admin Login</h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-stack-sm">
        <input
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className={inputClass}
        />

        <div className="text-right -mt-2">
          <Link
            href="/forgot-password?next=admin"
            className="font-label-md text-label-md text-brand-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>

        {serverError && (
          <p className="font-label-md text-label-md text-red-700 mt-1">{serverError}</p>
        )}
      </form>
    </main>
  );
}
