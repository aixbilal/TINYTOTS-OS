"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const MAX_LEN = { name: 80, phone: 20, email: 100, password: 72 };

function isValidPakPhone(phone: string) {
  const digits = phone.replace(/[\s-]/g, "");
  return /^(03\d{9}|\+923\d{9})$/.test(digits);
}

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [signupComplete, setSignupComplete] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Please enter your full name.";
    if (!email.trim()) errs.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Enter a valid email address.";
    if (!phone.trim()) errs.phone = "Phone number is required.";
    else if (!isValidPakPhone(phone)) errs.phone = "Enter a valid number, e.g. 03001234567.";
    if (password.length < 8) errs.password = "Password must be at least 8 characters.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (error) {
        setServerError(error.message);
        setSubmitting(false);
        return;
      }

      setSignupComplete(true);
    } catch {
      setServerError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full border rounded-lg px-4 py-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none transition-colors ${
      hasError ? "border-error focus:border-error" : "border-outline-variant focus:border-primary"
    }`;

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="font-label-md text-label-md text-error mt-1">{msg}</p> : null;

  if (signupComplete) {
    return (
      <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg text-center">
        <h1 className="font-display-md text-display-md text-on-surface mb-4">Check your email</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and log in.
        </p>
        <Link href="/login" className="inline-block mt-6 text-primary hover:underline font-body-sm text-body-sm">
          Go to login
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">Create your account</h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-stack-sm">
        <div>
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value.slice(0, MAX_LEN.name))}
            maxLength={MAX_LEN.name}
            className={inputClass(!!fieldErrors.fullName)}
          />
          <FieldError msg={fieldErrors.fullName} />
        </div>

        <div>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value.slice(0, MAX_LEN.email))}
            maxLength={MAX_LEN.email}
            className={inputClass(!!fieldErrors.email)}
          />
          <FieldError msg={fieldErrors.email} />
        </div>

        <div>
          <input
            type="tel"
            placeholder="Phone number (e.g. 03001234567)"
            value={phone}
            onChange={(e) => setPhone(e.target.value.slice(0, MAX_LEN.phone))}
            maxLength={MAX_LEN.phone}
            className={inputClass(!!fieldErrors.phone)}
          />
          <FieldError msg={fieldErrors.phone} />
        </div>

        <div>
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value.slice(0, MAX_LEN.password))}
            maxLength={MAX_LEN.password}
            className={inputClass(!!fieldErrors.password)}
          />
          <FieldError msg={fieldErrors.password} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-50 mt-2"
        >
          {submitting ? "Creating account..." : "Sign up"}
        </button>
        <FieldError msg={serverError ?? undefined} />

        <p className="font-body-sm text-body-sm text-on-surface-variant text-center mt-2">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </form>
    </main>
  );
}