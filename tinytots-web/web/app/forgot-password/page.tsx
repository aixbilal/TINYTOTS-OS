"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile";
import TurnstileChallenge from "@/components/TurnstileChallenge";

const RESET_NEXT_KEY = "tt_password_reset_next";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("next") === "admin";
  const loginHref = isAdmin ? "/admin/login" : "/login";

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  function resetCaptcha() {
    setCaptchaToken(null);
    setTurnstileKey((k) => k + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setFormError("Please enter your email address.");
      return;
    }
    if (!isValidEmail(trimmed)) {
      setFormError(EMAIL_ERROR);
      return;
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setFormError("Please complete the security check and try again.");
      return;
    }

    setSubmitting(true);
    try {
      // Remember where to send the user after they finish resetting
      // (survives even if the email redirect drops the query string).
      try {
        sessionStorage.setItem(RESET_NEXT_KEY, loginHref);
      } catch {
        /* private mode / blocked storage — next=admin in redirectTo is the fallback */
      }

      const resetPath = isAdmin ? "/reset-password?next=admin" : "/reset-password";
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          redirectTo: resetPath,
          ...(captchaToken ? { captchaToken } : {}),
        }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setFormError(
          typeof data.error === "string"
            ? data.error
            : "Too many requests. Please try again shortly."
        );
        setSubmitting(false);
        if (TURNSTILE_SITE_KEY) resetCaptcha();
        return;
      }

      // Always show the same confirmation — do not surface API errors that
      // could reveal whether an email is registered.
    } catch {
      // Network failures still get the generic confirmation for privacy.
    }
    setSent(true);
    setSubmitting(false);
  }

  if (sent) {
    return (
      <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg text-center">
        <h1 className="font-display-md text-display-md text-text-primary mb-4">Check your email</h1>
        <p className="font-body-md text-body-md text-text-secondary">
          If an account exists for that email, we&apos;ve sent a reset link. Check your inbox
          (and spam folder) and follow the link to choose a new password.
        </p>
        <Link
          href={loginHref}
          className="inline-block mt-6 text-brand-primary hover:underline font-body-sm text-body-sm"
        >
          Back to login
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 className="font-display-md text-display-md text-text-primary mb-stack-md">Reset your password</h1>
      <p className="font-body-sm text-body-sm text-text-secondary mb-stack-sm">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-stack-sm">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="w-full border rounded-lg px-4 py-3 bg-surface-elevated text-text-primary font-body-md text-body-md border-border-default focus:border-brand-primary focus:outline-none transition-colors"
        />

        {TURNSTILE_SITE_KEY && (
          <TurnstileChallenge
            key={turnstileKey}
            siteKey={TURNSTILE_SITE_KEY}
            onToken={setCaptchaToken}
            onExpired={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
          />
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
        >
          {submitting ? "Sending..." : "Send reset link"}
        </button>

        {formError && <p className="font-label-md text-label-md text-red-700 mt-1">{formError}</p>}

        <p className="font-body-sm text-body-sm text-text-secondary text-center mt-2">
          <Link href={loginHref} className="text-brand-primary hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
          <p className="font-body-md text-body-md text-text-secondary">Loading...</p>
        </main>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
