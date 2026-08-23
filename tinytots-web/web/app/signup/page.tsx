"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

import { validatePassword, PASSWORD_HINT } from "@/lib/validate-password";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";
import { isValidPakPhone, PAK_PHONE_ERROR } from "@/lib/validate-phone";

const MAX_LEN = { name: 80, phone: 20, email: 100, password: 72 };

const HIGHLIGHTS = [
  "Made with love & care",
  "Thoughtfully made materials",
  "Designed for comfort",
  "Trusted by families across Pakistan",
];

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [signupComplete, setSignupComplete] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Please enter your full name.";
    if (!email.trim()) errs.email = "Please enter your email.";
    else if (!isValidEmail(email)) errs.email = EMAIL_ERROR;
    if (!phone.trim()) errs.phone = "Phone number is required.";
    else if (!isValidPakPhone(phone)) errs.phone = PAK_PHONE_ERROR;
    const passwordError = validatePassword(password);
    if (passwordError) errs.password = passwordError;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setServerError("You're offline, please reconnect");
      return;
    }
    if (!validate()) return;

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
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setServerError(
          typeof data.error === "string"
            ? data.error
            : "Could not create account. Please try again."
        );
        setSubmitting(false);
        return;
      }

      setSignupComplete(true);
    } catch {
      setServerError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleGoogleSignup() {
    setServerError(null);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setServerError("You're offline, please reconnect");
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

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="font-label-md text-label-md text-red-700 mt-1">{msg}</p> : null;

  if (signupComplete) {
    return (
      <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg text-center">
        <span className="material-symbols-outlined text-brand-primary text-[48px] mb-4 inline-block">mark_email_read</span>
        <h1 className="font-display-md text-display-md text-text-primary mb-4">Check your email</h1>
        <p className="font-body-md text-body-md text-text-secondary">
          We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and log in.
        </p>
        <Link href="/login" className="inline-block mt-6 text-brand-primary hover:underline font-body-sm text-body-sm">
          Go to login
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] rounded-2xl border border-border-default overflow-hidden bg-surface-elevated">
        <div className="p-8 md:p-12 min-w-0">
          <h1 className="font-display-md text-display-md text-text-primary mb-2">Create your account</h1>
          <p className="font-body-md text-body-md text-text-secondary mb-stack-md">Join TinyTots and start your journey with us.</p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 max-w-sm">
            <div>
              <label className="font-label-md text-label-md text-text-secondary mb-1.5 block">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value.slice(0, MAX_LEN.name))}
                maxLength={MAX_LEN.name}
                className={inputClass(!!fieldErrors.fullName)}
              />
              <FieldError msg={fieldErrors.fullName} />
            </div>

            <div>
              <label className="font-label-md text-label-md text-text-secondary mb-1.5 block">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, MAX_LEN.email))}
                maxLength={MAX_LEN.email}
                className={inputClass(!!fieldErrors.email)}
              />
              <FieldError msg={fieldErrors.email} />
            </div>

            <div>
              <label className="font-label-md text-label-md text-text-secondary mb-1.5 block">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. 03001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value.slice(0, MAX_LEN.phone))}
                maxLength={MAX_LEN.phone}
                className={inputClass(!!fieldErrors.phone)}
              />
              <FieldError msg={fieldErrors.phone} />
            </div>

            <div>
              <label className="font-label-md text-label-md text-text-secondary mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.slice(0, MAX_LEN.password))}
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
              {fieldErrors.password ? (
                <FieldError msg={fieldErrors.password} />
              ) : (
                <p className="font-label-md text-label-md text-text-secondary mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">shield</span>
                  {PASSWORD_HINT}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
            >
              {submitting ? "Creating account..." : "Create Account"}
              {!submitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
            <FieldError msg={serverError ?? undefined} />

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
        </div>

        <div className="hidden md:flex flex-col justify-center gap-6 bg-brand-primary/[0.05] border-t md:border-t-0 md:border-l border-border-default p-8 min-w-0">
          <h2 className="font-display-md text-[26px] text-text-primary leading-snug">
            Timeless styles, thoughtfully made for little hearts.
          </h2>
          <ul className="flex flex-col gap-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2 font-body-sm text-body-sm text-text-primary">
                <span className="material-symbols-outlined text-brand-primary text-[18px]">check_circle</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
