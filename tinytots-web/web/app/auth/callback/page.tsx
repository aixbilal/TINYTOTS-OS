"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (cancelled) return;

      if (sessionError || !session) {
        setError("Sign-in failed. Please try again.");
        setTimeout(() => router.replace("/login"), 2000);
        return;
      }

      const { data: customer } = await supabase
        .from("customers")
        .select("phone")
        .eq("auth_user_id", session.user.id)
        .single();

      if (!customer?.phone) {
        router.replace("/account/add-phone");
      } else {
        router.replace("/account");
      }
    }

    handleCallback();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="max-w-md mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg text-center">
      <p className="font-body-md text-body-md text-text-secondary">
        {error ?? "Signing you in..."}
      </p>
    </main>
  );
}