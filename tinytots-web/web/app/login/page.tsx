"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!email.trim() || !password) {
      setServerError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Supabase returns "Invalid login credentials" for both wrong password
        // AND unconfirmed email — keep the message generic but helpful.
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setServerError("Please confirm your email first — check your inbox for the confirmation link.");
        } else {
          setServerError("Incorrect email or password.");
        }
        setSubmitting(false);
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setServerError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border rounded-lg px-4 py-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md border-outline-variant focus:border-primary focus:outline-none transition-colors";

  return (
    <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">Log in</h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-stack-sm">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />

        <div className="text-right -mt-2">
          <Link href="/forgot-password" className="font-label-md text-label-md text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-50 mt-2"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>

        {serverError && (
          <p className="font-label-md text-label-md text-error mt-1">{serverError}</p>
        )}

        <p className="font-body-sm text-body-sm text-on-surface-variant text-center mt-2">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
      </form>
    </main>
  );
}