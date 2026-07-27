"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import AccountSidebar from "@/components/AccountSidebar";

const MIN_PASSWORD_LEN = 8;

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [customerName, setCustomerName] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("customers")
      .select("full_name")
      .eq("auth_user_id", user.id)
      .single()
      .then(({ data }) => setCustomerName(data?.full_name ?? null));
  }, [user]);

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < MIN_PASSWORD_LEN) {
      setError(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (updateError) {
      setError(updateError.message || "Couldn't update your password. Please try again.");
      return;
    }

    setSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
  }

  const inputClass =
    "w-full border rounded-lg px-4 py-3 bg-surface text-on-surface font-body-md text-body-md border-outline-variant focus:border-primary focus:outline-none transition-colors";

  if (authLoading) {
    return (
      <main className="max-w-container-max mx-auto py-stack-lg">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="max-w-container-max mx-auto w-full py-stack-lg flex flex-col md:flex-row gap-gutter">
      <AccountSidebar name={customerName} />

      <section className="flex-grow flex flex-col gap-stack-md min-w-0 max-w-2xl">
        <div>
          <h1 className="font-display-md text-display-md text-on-surface">Login & Security</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Manage how you sign in to your TinyTots account.
          </p>
        </div>

        <div className="border border-on-surface/5 rounded-2xl p-6 bg-surface-container-lowest flex flex-col gap-1">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Signed in as
          </p>
          <p className="font-body-md text-body-md text-on-surface">{user.email ?? user.phone}</p>
        </div>

        <form
          onSubmit={handlePasswordUpdate}
          className="border border-on-surface/5 rounded-2xl p-6 bg-surface-container-lowest flex flex-col gap-4"
        >
          <h2 className="font-headline-md text-headline-md text-on-surface">Change Password</h2>

          <div>
            <label className="font-body-sm text-body-sm text-on-surface-variant mb-2 block">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={`At least ${MIN_PASSWORD_LEN} characters`}
              className={inputClass}
            />
          </div>

          <div>
            <label className="font-body-sm text-body-sm text-on-surface-variant mb-2 block">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && <p className="font-label-md text-label-md text-error">{error}</p>}
          {success && (
            <p className="font-label-md text-label-md text-tertiary">Password updated successfully.</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="self-start bg-primary-container text-on-primary font-button text-button px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving..." : "Update Password"}
          </button>
        </form>
      </section>
    </main>
  );
}