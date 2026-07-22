"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.session) {
        setServerError("Incorrect email or password.");
        setSubmitting(false);
        return;
      }

      // Confirm this user is actually an active admin before letting them in
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("id, is_active")
        .eq("auth_user_id", data.session.user.id)
        .maybeSingle();

      if (!adminRow || !adminRow.is_active) {
        await supabase.auth.signOut();
        setServerError("This account does not have admin access.");
        setSubmitting(false);
        return;
      }

      router.push("/admin");
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
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">Admin Login</h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-stack-sm">
        <input
          type="email"
          placeholder="Admin email"
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
      </form>
    </main>
  );
}