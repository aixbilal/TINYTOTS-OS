"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { metaFor, isAbsoluteHttpUrl, SETTINGS_SECTIONS } from "@/lib/admin-settings-meta";
import { AdminPageHeader, AdminCard, AdminButton } from "@/components/admin/ui";

type Setting = { key: string; value: string; description: string | null; updated_at: string | null };

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
      if (!res.ok) {
        setSettings([]);
        setError(data.error || "Failed to load settings");
        return;
      }
      setSettings(data.settings || []);
      const initial: Record<string, string> = {};
      for (const s of data.settings || []) initial[s.key] = s.value;
      setEditValues(initial);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  function clientError(key: string, value: string): string | null {
    const meta = metaFor(key);
    if ((meta.type === "number" || meta.type === "percent") && value !== "") {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0) return "Enter a non-negative number.";
      if (meta.type === "percent" && n > 100) return "Enter a value between 0 and 100.";
    }
    if (meta.type === "url" && value.trim() !== "" && !isAbsoluteHttpUrl(value)) {
      return "Enter a full URL starting with https://";
    }
    return null;
  }

  async function handleSave(key: string) {
    const value = editValues[key] ?? "";
    const ce = clientError(key, value);
    if (ce) {
      setError(`${metaFor(key).label}: ${ce}`);
      return;
    }
    setSavingKey(key);
    setError(null);
    setSuccessKey(null);
    try {
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
      setTimeout(() => setSuccessKey(null), 2500);
    } catch (err: any) {
      setError(err.message || `Failed to update ${key}`);
    } finally {
      setSavingKey(null);
    }
  }

  const grouped = useMemo(() => {
    const bySection: Record<string, Setting[]> = {};
    for (const s of settings) {
      const sec = metaFor(s.key).section;
      (bySection[sec] ||= []).push(s);
    }
    return [...SETTINGS_SECTIONS]
      .filter((sec) => bySection[sec]?.length)
      .map((sec) => ({ section: sec, items: bySection[sec] }));
  }, [settings]);

  if (loading) return <p className="font-body-sm text-body-sm text-text-secondary">Loading settings…</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader
        title="Settings"
        description="Reward amounts, delivery coverage, and the store's public contact and social profiles."
      />

      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 font-body-sm text-body-sm text-red-800">
          {error}
        </p>
      )}

      <div className="space-y-6">
        {grouped.map(({ section, items }) => (
          <AdminCard key={section} title={section} padded={false}>
            <div className="divide-y divide-border-default">
              {items.map((setting) => {
                const meta = metaFor(setting.key);
                const val = editValues[setting.key] ?? "";
                const isDirty = val !== setting.value;
                const isSaving = savingKey === setting.key;
                const justSaved = successKey === setting.key;
                const fieldId = `set-${setting.key}`;

                return (
                  <div key={setting.key} className="p-4 sm:p-5">
                    <label htmlFor={fieldId} className="block font-body-sm text-body-sm font-medium text-text-primary">
                      {meta.label}
                    </label>
                    {(meta.help || setting.description) && (
                      <p className="mt-0.5 font-label-md text-label-md text-text-secondary">
                        {meta.help || setting.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {meta.type === "select" ? (
                        <select
                          id={fieldId}
                          value={val}
                          onChange={(e) =>
                            setEditValues((p) => ({ ...p, [setting.key]: e.target.value }))
                          }
                          className="rounded-md border border-border-default bg-surface-elevated px-3 py-2 font-body-sm text-body-sm focus:border-brand-primary focus:outline-none"
                        >
                          {(meta.options || []).map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={fieldId}
                          type={
                            meta.type === "number" || meta.type === "percent"
                              ? "number"
                              : meta.type === "tel"
                                ? "tel"
                                : meta.type === "url"
                                  ? "url"
                                  : "text"
                          }
                          inputMode={meta.type === "number" || meta.type === "percent" ? "numeric" : undefined}
                          min={meta.type === "number" || meta.type === "percent" ? 0 : undefined}
                          max={meta.type === "percent" ? 100 : undefined}
                          placeholder={meta.placeholder}
                          value={val}
                          onChange={(e) =>
                            setEditValues((p) => ({ ...p, [setting.key]: e.target.value }))
                          }
                          className={`rounded-md border border-border-default bg-surface-elevated px-3 py-2 font-body-sm text-body-sm text-text-primary focus:border-brand-primary focus:outline-none ${
                            meta.type === "url" || meta.type === "text" ? "w-full max-w-md" : "w-44"
                          }`}
                        />
                      )}
                      <AdminButton
                        variant="primary"
                        onClick={() => handleSave(setting.key)}
                        disabled={!isDirty || isSaving}
                      >
                        {isSaving ? "Saving…" : "Save"}
                      </AdminButton>
                      {justSaved && (
                        <span className="font-label-md text-label-md text-green-700">Saved</span>
                      )}
                    </div>

                    <p className="mt-2 font-label-md text-[11px] text-text-secondary">
                      {setting.updated_at
                        ? `Last updated ${new Date(setting.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                        : "Not set yet"}
                    </p>
                  </div>
                );
              })}
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
