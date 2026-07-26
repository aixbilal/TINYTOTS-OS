"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

type Setting = {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
};

const LABELS: Record<string, string> = {
  signup_voucher_amount: "Signup Voucher Amount (Rs.)",
  referral_voucher_amount: "Referral Reward Amount (Rs.)",
  referral_voucher_valid_days: "Referral Voucher Validity (days)",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
        const res = await adminFetch("/api/admin/settings");
        const data = await res.json();
        setSettings(data.settings);
      const initial: Record<string, string> = {};
      for (const s of data.settings) initial[s.key] = s.value;
      setEditValues(initial);
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(key: string) {
    setSavingKey(key);
    setError(null);
    setSuccessKey(null);
    try {
      const value = editValues[key];
      const res = await adminFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save");
      }
      setSuccessKey(key);
      await loadSettings();
      setTimeout(() => setSuccessKey(null), 2000);
    } catch (err: any) {
      setError(err.message || `Failed to update ${key}`);
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return <div className="p-6 text-on-surface-variant">Loading settings...</div>;
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-on-surface mb-1">Settings</h1>
      <p className="text-on-surface-variant text-sm mb-6">
        Control voucher and reward amounts used across the storefront and admin panel.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-error bg-error/10 px-4 py-3 text-error text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {settings.map((setting) => {
          const isDirty = editValues[setting.key] !== setting.value;
          const isSaving = savingKey === setting.key;
          const justSaved = successKey === setting.key;

          return (
            <div
              key={setting.key}
              className="border border-outline-variant rounded-xl p-4 bg-surface-container-lowest"
            >
              <label className="block text-sm font-medium text-on-surface mb-1">
                {LABELS[setting.key] ?? setting.key}
              </label>
              {setting.description && (
                <p className="text-xs text-on-surface-variant mb-3">{setting.description}</p>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  value={editValues[setting.key] ?? ""}
                  onChange={(e) =>
                    setEditValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                  }
                  className="w-40 border border-outline-variant rounded-lg px-3 py-2 bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => handleSave(setting.key)}
                  disabled={!isDirty || isSaving || !editValues[setting.key]}
                  className="px-4 py-2 rounded-lg bg-primary-container text-on-primary text-sm font-medium hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                {justSaved && (
                  <span className="text-sm text-green-600">Saved</span>
                )}
              </div>

              <p className="text-xs text-on-surface-variant mt-2">
                Last updated: {new Date(setting.updated_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}