"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isValidPakPhone, PAK_PHONE_ERROR } from "@/lib/validate-phone";

export default function AddPhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkExisting() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      const { data: customer } = await supabase
        .from("customers")
        .select("phone")
        .eq("auth_user_id", session.user.id)
        .single();

      if (customer?.phone) {
        router.replace("/account");
      } else {
        setChecking(false);
      }
    }
    checkExisting();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidPakPhone(phone)) {
      setError(PAK_PHONE_ERROR);
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const { error: updateError } = await supabase
        .from("customers")
        .update({ phone: phone.trim() })
        .eq("auth_user_id", session.user.id);

      if (updateError) {
        if (updateError.message.toLowerCase().includes("duplicate")) {
          setError("This phone number is already linked to another account.");
        } else {
          setError("Something went wrong. Please try again.");
        }
        return;
      }

      router.replace("/account");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg text-center">
        <p className="font-body-md text-body-md text-text-secondary">Loading...</p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 className="font-display-md text-display-md text-text-primary mb-2">One last step</h1>
      <p className="font-body-md text-body-md text-text-secondary mb-stack-md">
        Add your phone number so we can process orders, referrals, and vouchers on your account.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-stack-sm">
        <input
          type="tel"
          placeholder="Phone number (e.g. 03001234567)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-border-default rounded-lg px-4 py-3 bg-surface-elevated text-text-primary font-body-md text-body-md focus:outline-none focus:border-brand-primary transition-colors"
        />
        {error && <p className="font-label-md text-label-md text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
        >
          {submitting ? "Saving..." : "Continue"}
        </button>
      </form>
    </main>
  );
}