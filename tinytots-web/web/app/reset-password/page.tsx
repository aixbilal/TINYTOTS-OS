"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { validatePassword, PASSWORD_HINT } from "@/lib/validate-password";

const RESET_NEXT_KEY = "tt_password_reset_next";

function resolveLoginHref(nextParam: string | null): string {
  if (nextParam === "admin") return "/admin/login";
  try {
    const stored = sessionStorage.getItem(RESET_NEXT_KEY);
    if (stored === "/admin/login") return "/admin/login";
  } catch {
    /* ignore */
  }
  return "/login";
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginHref = resolveLoginHref(searchParams.get("next"));
  const forgotHref =
    loginHref === "/admin/login" ? "/forgot-password?next=admin" : "/forgot-password";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Supabase requires AAL2 to change password when MFA is enrolled — recovery
  // links only grant AAL1, so challenge TOTP before showing the password form.
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let settled = false;

    async function afterSessionReady() {
      if (cancelled || settled) return;
      settled = true;

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const needsMfa = aal?.nextLevel === "aal2" && aal?.currentLevel !== "aal2";
      if (needsMfa) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp?.find((f) => f.status === "verified") || factors?.totp?.[0];
        if (totp) setMfaFactorId(totp.id);
      }
      if (!cancelled) setReady(true);
    }

    function markFailed(message: string) {
      if (cancelled || settled) return;
      settled = true;
      setLinkError(message);
    }

    function cleanUrlKeepNext() {
      const url = new URL(window.location.href);
      const next = url.searchParams.get("next");
      const keep = next === "admin" ? "?next=admin" : "";
      window.history.replaceState({}, "", url.pathname + keep);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        void afterSessionReady();
      }
    });

    async function bootstrap() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          markFailed("This reset link is invalid or has expired. Please request a new one.");
          return;
        }
        url.searchParams.delete("code");
        cleanUrlKeepNext();
        await afterSessionReady();
        return;
      }

      if (tokenHash && (type === "recovery" || type === "email")) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type === "recovery" ? "recovery" : "email",
        });
        if (cancelled) return;
        if (error) {
          markFailed("This reset link is invalid or has expired. Please request a new one.");
          return;
        }
        await afterSessionReady();
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (cancelled) return;
        if (error) {
          markFailed("This reset link is invalid or has expired. Please request a new one.");
          return;
        }
        cleanUrlKeepNext();
        await afterSessionReady();
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        await afterSessionReady();
        return;
      }

      window.setTimeout(async () => {
        if (cancelled || settled) return;
        const {
          data: { session: lateSession },
        } = await supabase.auth.getSession();
        if (lateSession) {
          await afterSessionReady();
        } else {
          markFailed("This reset link is invalid or has expired. Please request a new one.");
        }
      }, 2500);
    }

    void bootstrap();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

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

    setMfaFactorId(null);
    setMfaCode("");
    setMfaVerifying(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setServerError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setServerError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setServerError(error.message);
      setSubmitting(false);
      return;
    }

    await supabase.auth.signOut();
    try {
      sessionStorage.removeItem(RESET_NEXT_KEY);
    } catch {
      /* ignore */
    }
    setSuccess(true);
    setTimeout(() => router.push(loginHref), 2000);
  }

  const inputClass =
    "w-full border rounded-lg px-4 py-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md border-outline-variant focus:border-primary focus:outline-none transition-colors";

  if (success) {
    return (
      <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg text-center">
        <h1 className="font-display-md text-display-md text-on-surface mb-4">Password updated</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Your password has been changed. Redirecting you to login...
        </p>
      </main>
    );
  }

  if (linkError) {
    return (
      <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg text-center">
        <h1 className="font-display-md text-display-md text-on-surface mb-4">Link expired</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">{linkError}</p>
        <Link href={forgotHref} className="text-primary hover:underline font-body-sm text-body-sm">
          Request a new reset link
        </Link>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">Verifying reset link...</p>
      </main>
    );
  }

  if (mfaFactorId) {
    return (
      <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        <h1 className="font-display-md text-display-md text-on-surface mb-2">Two-factor authentication</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-stack-sm">
          Enter the 6-digit code from your authenticator app to continue resetting your password.
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
            className="w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-50 mt-2"
          >
            {mfaVerifying ? "Verifying..." : "Verify and continue"}
          </button>

          {serverError && (
            <p className="font-label-md text-label-md text-error mt-1">{serverError}</p>
          )}
        </form>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">Set a new password</h1>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-stack-sm">{PASSWORD_HINT}</p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-stack-sm">
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          className={inputClass}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-50 mt-2"
        >
          {submitting ? "Updating..." : "Update password"}
        </button>

        {serverError && <p className="font-label-md text-label-md text-error mt-1">{serverError}</p>}
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">Verifying reset link...</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
