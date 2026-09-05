"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile";
import TurnstileChallenge from "@/components/TurnstileChallenge";
import AuthShell from "@/components/auth/AuthShell";
import FormAlert from "@/components/auth/FormAlert";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Already signed in? Don't show the sign-in form — send them to their account.
  // OAuth returns through /auth/callback (not here), so this can't loop.
  useEffect(() => {
    if (!loading && user) router.replace("/account");
  }, [user, loading, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  // Field-level validation state, separate from serverError (form/auth-level).
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function resetCaptcha() {
    setCaptchaToken(null);
    setTurnstileKey((k) => k + 1);
  }

  function validateEmailField(value: string): string | undefined {
    if (!value.trim()) return "Please enter your email.";
    if (!isValidEmail(value)) return EMAIL_ERROR;
    return undefined;
  }

  function validatePasswordField(value: string): string | undefined {
    if (!value) return "Please enter your password.";
    return undefined;
  }

  function handleEmailBlur() {
    setTouched((t) => ({ ...t, email: true }));
    setFieldErrors((e) => ({ ...e, email: validateEmailField(email) }));
  }

  function handlePasswordBlur() {
    setTouched((t) => ({ ...t, password: true }));
    setFieldErrors((e) => ({ ...e, password: validatePasswordField(password) }));
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    if (touched.email) setFieldErrors((e) => ({ ...e, email: validateEmailField(value) }));
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (touched.password) setFieldErrors((e) => ({ ...e, password: validatePasswordField(value) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setServerError("We couldn't connect right now. Please try again.");
      return;
    }

    const emailErr = validateEmailField(email);
    const passwordErr = validatePasswordField(password);
    setTouched({ email: true, password: true });
    setFieldErrors({ email: emailErr, password: passwordErr });
    if (emailErr || passwordErr) return;

    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setServerError("Please complete the security check and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(captchaToken ? { captchaToken } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) {
          setServerError("Too many sign-in attempts. Please wait a little and try again.");
        } else {
          setServerError(
            typeof data.error === "string"
              ? data.error
              : "We couldn't sign you in. Check your email and password and try again."
          );
        }
        setSubmitting(false);
        if (TURNSTILE_SITE_KEY) resetCaptcha();
        return;
      }

      // Full document navigation (not router.push): the server login route
      // sets the Supabase auth cookies, but the already-running browser
      // AuthProvider/Supabase client keeps its stale pre-login in-memory
      // session across an SPA transition. A hard navigation forces it to
      // initialize fresh and read the newly-set cookie session immediately.
      // replace() so a successful login doesn't leave /login in Back history.
      window.location.replace("/account");
    } catch {
      setServerError("We couldn't connect right now. Please try again.");
      setSubmitting(false);
      if (TURNSTILE_SITE_KEY) resetCaptcha();
    }
  }

  async function handleGoogleLogin() {
    setServerError(null);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setServerError("We couldn't connect right now. Please try again.");
      return;
    }
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setServerError("Couldn't start Google sign-in. Please try again.");
      setGoogleLoading(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full border rounded-lg px-4 py-3 bg-surface-elevated text-text-primary font-body-md text-body-md focus:outline-none transition-colors ${
      hasError ? "border-red-700 focus:border-red-700" : "border-border-default focus:border-brand-primary"
    }`;

  return (
    <AuthShell tagline="Curated kidswear for life's little moments.">
      <h1 className="font-display-md text-display-md text-text-primary mb-2">Welcome back!</h1>
      <p className="font-body-md text-body-md text-text-secondary mb-stack-md">Sign in to continue to your account.</p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label htmlFor="login-email" className="font-label-md text-label-md text-text-secondary mb-1.5 block">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={handleEmailBlur}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
            className={inputClass(!!fieldErrors.email)}
          />
          {fieldErrors.email && (
            <p id="login-email-error" className="font-label-md text-label-md text-red-700 mt-1">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="login-password" className="font-label-md text-label-md text-text-secondary mb-1.5 block">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={handlePasswordBlur}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
              className={`${inputClass(!!fieldErrors.password)} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-brand-primary"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
          {fieldErrors.password && (
            <p id="login-password-error" className="font-label-md text-label-md text-red-700 mt-1">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end -mt-1">
          <Link href="/forgot-password" className="font-label-md text-label-md text-brand-primary hover:underline">
            Forgot password?
          </Link>
        </div>

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
          className="w-full py-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? "Signing in..." : "Sign In"}
          {!submitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
        </button>

        <FormAlert>{serverError}</FormAlert>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-border-default" />
          <span className="font-label-md text-label-md text-text-secondary uppercase tracking-wider">or continue with</span>
          <div className="flex-1 h-px bg-border-default" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full py-3 rounded-xl border border-border-default flex items-center justify-center gap-3 font-button text-button text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <p className="font-body-sm text-body-sm text-text-secondary text-center mt-1">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-brand-primary hover:underline font-medium">Sign up</Link>
        </p>
      </form>
    </AuthShell>
  );
}
