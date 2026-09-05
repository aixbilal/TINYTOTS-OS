"use client";

import { useState } from "react";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { validatePassword } from "@/lib/validate-password";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import AdminMfaSettings from "@/components/admin/AdminMfaSettings";
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminAlert,
  AdminField,
  adminInputClass,
} from "@/components/admin/ui";

export default function AdminAccountPage() {
  const { admin, session } = useAdminAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!admin) return null;

  const showMatchError = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const showMatchSuccess = confirmPassword.length > 0 && newPassword.length > 0 && newPassword === confirmPassword;

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const token = session?.access_token;
    if (!token) {
      setError("Your session expired. Please log in again.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/account/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Failed to update password.");
      } else {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSaving(false);
  }

  const detail = (label: string, value: string) => (
    <div>
      <p className="mb-1 font-label-md text-label-md uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="font-body-sm text-body-sm text-text-primary">{value}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-lg">
      <AdminPageHeader breadcrumb={["Account"]} title="My account" />

      <div className="space-y-6">
        <AdminCard title="Your details">
          <div className="grid grid-cols-2 gap-4">
            {detail("Name", admin.name)}
            {detail("Email", admin.email)}
            {detail("Role", admin.role.replace("_", " "))}
            {detail("Status", admin.is_active ? "Active" : "Inactive")}
          </div>
          <p className="mt-4 font-label-md text-label-md text-text-secondary">
            To change your name, email, or role, contact an administrator.
          </p>
        </AdminCard>

        <AdminCard title="Change password">
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <AdminField label="Current password">
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className={adminInputClass}
              />
            </AdminField>
            <AdminField label="New password">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => setNewPasswordTouched(true)}
                autoComplete="new-password"
                className={adminInputClass}
              />
              <PasswordRequirements password={newPassword} showErrors={newPasswordTouched} />
            </AdminField>
            <AdminField label="Confirm new password">
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className={adminInputClass}
              />
              {showMatchError && (
                <p className="font-label-md text-label-md text-red-700 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">error</span>
                  Passwords don&apos;t match.
                </p>
              )}
              {showMatchSuccess && (
                <p className="font-label-md text-label-md text-green-700 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">check_circle</span>
                  Passwords match
                </p>
              )}
            </AdminField>
            {error && <AdminAlert tone="danger">{error}</AdminAlert>}
            {success && <AdminAlert tone="success">Password updated successfully.</AdminAlert>}
            <AdminButton type="submit" variant="primary" disabled={saving} className="self-start">
              {saving ? "Saving…" : "Update password"}
            </AdminButton>
          </form>
        </AdminCard>

        <AdminMfaSettings />
      </div>
    </div>
  );
}
