"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!email.trim()) {
      setServerError("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setServerError(error.message);
        setSubmitting(false);
        return;
      }

      setSent(true);
    } catch {
      setServerError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg text-center">
        <h1 className="font-display-md text-display-md text-on-surface mb-4">Check your email</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
        </p>
        <Link href="/login" className="inline-block mt-6 text-primary hover:underline font-body-sm text-body-sm">
          Back to login
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">Reset your password</h1>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-stack-sm">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-stack-sm">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md border-outline-variant focus:border-primary focus:outline-none transition-colors"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-50 mt-2"
        >
          {submitting ? "Sending..." : "Send reset link"}
        </button>

        {serverError && <p className="font-label-md text-label-md text-error mt-1">{serverError}</p>}

        <p className="font-body-sm text-body-sm text-on-surface-variant text-center mt-2">
          <Link href="/login" className="text-primary hover:underline">Back to login</Link>
        </p>
      </form>
    </main>
  );
}