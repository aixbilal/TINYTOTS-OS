"use client";

import { useState } from "react";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { validatePassword, PASSWORD_HINT } from "@/lib/validate-password";
import AdminMfaSettings from "@/components/admin/AdminMfaSettings";

export default function AdminAccountPage() {
  const { admin, session } = useAdminAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!admin) return null;

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

  const inputClass = "border rounded-md px-3 py-2 text-sm w-full";

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Account</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Your details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Name</p>
            <p className="text-gray-900">{admin.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Email</p>
            <p className="text-gray-900">{admin.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Role</p>
            <p className="text-gray-900 capitalize">{admin.role.replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Status</p>
            <p className="text-gray-900">{admin.is_active ? "Active" : "Inactive"}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          To change your name, email, or role, contact an administrator.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Change password</h2>
        <p className="text-xs text-gray-500 mb-3">{PASSWORD_HINT}</p>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Current password</label>
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">New password</label>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Confirm new password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-green-600">Password updated successfully.</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 self-start"
          >
            {saving ? "Saving..." : "Update password"}
          </button>
        </form>
      </div>

      <AdminMfaSettings />
    </div>
  );
}
