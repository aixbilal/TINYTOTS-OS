"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

import { validatePassword } from "@/lib/validate-password";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";
import { isValidPakPhone, PAK_PHONE_ERROR } from "@/lib/validate-phone";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile";
import TurnstileChallenge from "@/components/TurnstileChallenge";
import AuthShell from "@/components/auth/AuthShell";
import FormAlert from "@/components/auth/FormAlert";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import PasswordVisibilityToggle from "@/components/auth/PasswordVisibilityToggle";

const MAX_LEN = { name: 80, phone: 20, email: 100, password: 72 };

type FieldName = "fullName" | "email" | "phone" | "password";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [signupComplete, setSignupComplete] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  function resetCaptcha() {
    setCaptchaToken(null);
    setTurnstileKey((k) => k + 1);
  }

  function validateField(name: FieldName, value: string): string | undefined {
    switch (name) {
      case "fullName":
        return value.trim() ? undefined : "Please enter your full name.";
      case "email":
        if (!value.trim()) return "Please enter your email.";
        return isValidEmail(value) ? undefined : EMAIL_ERROR;
      case "phone":
        if (!value.trim()) return "Phone number is required.";
        return isValidPakPhone(value) ? undefined : PAK_PHONE_ERROR;
      case "password":
        return validatePassword(value) ?? undefined;
    }
  }

  function handleBlur(name: FieldName, value: string) {
    setTouched((t) => ({ ...t, [name]: true }));
    setFieldErrors((e) => ({ ...e, [name]: validateField(name, value) }));
  }

  function handleChange(name: FieldName, value: string, setter: (v: string) => void) {
    setter(value);
    if (touched[name]) setFieldErrors((e) => ({ ...e, [name]: validateField(name, value) }));
  }

  function validateAll(): boolean {
    const values: Record<FieldName, string> = { fullName, email, phone, password };
    const errs: Partial<Record<FieldName, string>> = {};
    (Object.keys(values) as FieldName[]).forEach((name) => {
      const err = validateField(name, values[name]);
      if (err) errs[name] = err;
    });
    setTouched({ fullName: true, email: true, phone: true, password: true });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setServerError("We couldn't connect right now. Please try again.");
      return;
    }
    if (!validateAll()) return;
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setServerError("Please complete the security check and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          phone: phone.trim(),
          ...(captchaToken ? { captchaToken } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) {
          setServerError("Too many attempts. Please wait a little and try again.");
        } else {
          setServerError(
            typeof data.error === "string"
              ? data.error
              : "We couldn't create your account. Please try again."
          );
        }
        setSubmitting(false);
        if (TURNSTILE_SITE_KEY) resetCaptcha();
        return;
      }

      setSignupComplete(true);
    } catch {
      setServerError("We couldn't connect right now. Please try again.");
      setSubmitting(false);
      if (TURNSTILE_SITE_KEY) resetCaptcha();
    }
  }

  async function handleGoogleSignup() {
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

  const FieldError = ({ id, msg }: { id: string; msg?: string }) =>
    msg ? (
      <p id={id} className="font-label-md text-label-md text-red-700 mt-1">
        {msg}
      </p>
    ) : null;

  if (signupComplete) {
    return (
      <AuthShell>
        <div className="text-center">
          <span className="material-symbols-outlined text-brand-primary text-[48px] mb-4 inline-block">mark_email_read</span>
          <h1 className="font-display-md text-display-md text-text-primary mb-4">Check your email</h1>
          <p className="font-body-md text-body-md text-text-secondary">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and log in.
          </p>
          <Link href="/login" className="inline-block mt-6 text-brand-primary hover:underline font-body-sm text-body-sm">
            Go to login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell tagline="Curated kidswear for life's little moments.">
      <h1 className="font-display-lg text-display-lg text-text-primary mb-2.5 tracking-tight">Create your account</h1>
      <p className="font-body-md text-body-md text-text-secondary mb-8">Join TinyTots and start your journey with us.</p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label htmlFor="signup-name" className="font-label-md text-label-md text-text-secondary mb-1.5 block">
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => handleChange("fullName", e.target.value.slice(0, MAX_LEN.name), setFullName)}
            onBlur={(e) => handleBlur("fullName", e.target.value)}
            maxLength={MAX_LEN.name}
            aria-invalid={!!fieldErrors.fullName}
            aria-describedby={fieldErrors.fullName ? "signup-name-error" : undefined}
            className={inputClass(!!fieldErrors.fullName)}
          />
          <FieldError id="signup-name-error" msg={fieldErrors.fullName} />
        </div>

        <div>
          <label htmlFor="signup-email" className="font-label-md text-label-md text-text-secondary mb-1.5 block">
            Email Address
          </label>
          <input
            id="signup-email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => handleChange("email", e.target.value.slice(0, MAX_LEN.email), setEmail)}
            onBlur={(e) => handleBlur("email", e.target.value)}
            maxLength={MAX_LEN.email}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "signup-email-error" : undefined}
            className={inputClass(!!fieldErrors.email)}
          />
          <FieldError id="signup-email-error" msg={fieldErrors.email} />
        </div>

        <div>
          <label htmlFor="signup-phone" className="font-label-md text-label-md text-text-secondary mb-1.5 block">
            Phone Number
          </label>
          <input
            id="signup-phone"
            type="tel"
            placeholder="e.g. 03001234567"
            value={phone}
            onChange={(e) => handleChange("phone", e.target.value.slice(0, MAX_LEN.phone), setPhone)}
            onBlur={(e) => handleBlur("phone", e.target.value)}
            maxLength={MAX_LEN.phone}
            aria-invalid={!!fieldErrors.phone}
            aria-describedby={fieldErrors.phone ? "signup-phone-error" : undefined}
            className={inputClass(!!fieldErrors.phone)}
          />
          <FieldError id="signup-phone-error" msg={fieldErrors.phone} />
        </div>

        <div>
          <label htmlFor="signup-password" className="font-label-md text-label-md text-text-secondary mb-1.5 block">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => handleChange("password", e.target.value.slice(0, MAX_LEN.password), setPassword)}
              onBlur={(e) => handleBlur("password", e.target.value)}
              aria-invalid={!!fieldErrors.password}
              aria-describedby="signup-password-requirements"
              className={`${inputClass(!!fieldErrors.password)} pr-11`}
            />
            <PasswordVisibilityToggle visible={showPassword} onToggle={() => setShowPassword((s) => !s)} />
          </div>
          <div id="signup-password-requirements">
            <PasswordRequirements password={password} showErrors={!!touched.password && !!fieldErrors.password} />
          </div>
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
          className="w-full py-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
        >
          {submitting ? "Creating account..." : "Create Account"}
          {!submitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
        </button>

        <FormAlert>{serverError}</FormAlert>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-border-default" />
          <span className="font-label-md text-label-md text-text-secondary uppercase tracking-wider">or sign up with</span>
          <div className="flex-1 h-px bg-border-default" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
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
          Already have an account?{" "}
          <Link href="/login" className="text-brand-primary hover:underline font-medium">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
