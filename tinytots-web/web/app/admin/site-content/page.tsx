"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

const ICON_OPTIONS = [
  "shield_check",
  "eco",
  "local_shipping",
  "sync_alt",
  "verified",
  "lock",
  "air",
  "favorite",
  "handshake",
  "construction",
  "bolt",
  "spa",
  "group",
  "checkroom",
];
const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900";

type Tab = "trust" | "features" | "stats" | "badges";

interface TrustItem {
  id: number;
  icon: string;
  heading: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

interface FeatureItem {
  id: number;
  icon: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

interface StatItem {
  id: number;
  icon: string;
  value: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

interface BadgeItem {
  id: number;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export default function AdminSiteContentPage() {
  const [tab, setTab] = useState<Tab>("trust");
  const [trustItems, setTrustItems] = useState<TrustItem[]>([]);
  const [featureItems, setFeatureItems] = useState<FeatureItem[]>([]);
  const [statItems, setStatItems] = useState<StatItem[]>([]);
  const [badgeItems, setBadgeItems] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [trustRes, featureRes, statRes, badgeRes] = await Promise.all([
        adminFetch("/api/admin/trust-items"),
        adminFetch("/api/admin/feature-items"),
        adminFetch("/api/admin/stat-items"),
        adminFetch("/api/admin/badge-items"),
      ]);
      const [trustPayload, featurePayload, statPayload, badgePayload] = await Promise.all([
        trustRes.json(),
        featureRes.json(),
        statRes.json(),
        badgeRes.json(),
      ]);
      if (!trustRes.ok) throw new Error(trustPayload.error || "Failed to load trust items.");
      if (!featureRes.ok) throw new Error(featurePayload.error || "Failed to load feature items.");
      if (!statRes.ok) throw new Error(statPayload.error || "Failed to load stat items.");
      if (!badgeRes.ok) throw new Error(badgePayload.error || "Failed to load badge items.");
      setTrustItems(trustPayload.items || []);
      setFeatureItems(featurePayload.items || []);
      setStatItems(statPayload.items || []);
      setBadgeItems(badgePayload.items || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load libraries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  function flash(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2000);
  }

  async function patch(path: string, updates: Record<string, unknown>) {
    const response = await adminFetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      setError((await response.json()).error || "Save failed.");
      await load();
      return false;
    }
    return true;
  }

  async function reorder(path: string, order: number[]) {
    const response = await adminFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    if (!response.ok) {
      setError((await response.json()).error || "Reorder failed.");
      await load();
    }
  }

  async function remove(path: string, confirmText: string) {
    if (!window.confirm(confirmText)) return;
    const response = await adminFetch(path, { method: "DELETE" });
    if (!response.ok) {
      setError((await response.json()).error || "Delete failed.");
      return;
    }
    await load();
    flash("Deleted.");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "trust", label: "Trust items (campaigns)" },
    { id: "features", label: "Feature icons" },
    { id: "stats", label: "Stats" },
    { id: "badges", label: "Badges" },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Signage Libraries</h1>
        <p className="text-sm text-gray-500">
          Maintain reusable pools here, then select items inside each campaign (or product badges).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === item.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="rounded-lg border border-gray-200 p-5">
        {message && <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-500">Loading libraries...</p>
        ) : tab === "trust" ? (
          <>
            <p className="mb-4 text-sm text-gray-500">
              Used only by campaign pages and in-store signage — not the trust strip shown site-wide
              on customer pages (that one is a separate, fixed four-item strip).
            </p>
            <div className="mb-4 flex flex-col gap-2">
              {trustItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 rounded-md border border-gray-200 p-2">
                  <select
                    value={item.icon}
                    onChange={(event) => {
                      setTrustItems((current) =>
                        current.map((row) => (row.id === item.id ? { ...row, icon: event.target.value } : row))
                      );
                      void patch(`/api/admin/trust-items/${item.id}`, { icon: event.target.value });
                    }}
                    className={`${inputClass} w-40`}
                  >
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon}>{icon}</option>
                    ))}
                  </select>
                  <input
                    value={item.heading}
                    onChange={(event) => {
                      const heading = event.target.value;
                      setTrustItems((current) =>
                        current.map((row) => (row.id === item.id ? { ...row, heading } : row))
                      );
                      void patch(`/api/admin/trust-items/${item.id}`, { heading });
                    }}
                    placeholder="Heading"
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    value={item.description}
                    onChange={(event) => {
                      const description = event.target.value;
                      setTrustItems((current) =>
                        current.map((row) => (row.id === item.id ? { ...row, description } : row))
                      );
                      void patch(`/api/admin/trust-items/${item.id}`, { description });
                    }}
                    placeholder="Description"
                    className={`${inputClass} flex-1`}
                  />
                  <label className="flex shrink-0 items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={item.is_active}
                      onChange={(event) => {
                        const is_active = event.target.checked;
                        setTrustItems((current) =>
                          current.map((row) => (row.id === item.id ? { ...row, is_active } : row))
                        );
                        void patch(`/api/admin/trust-items/${item.id}`, { is_active });
                      }}
                    />
                    Available
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...trustItems];
                      const target = index - 1;
                      if (target < 0) return;
                      [next[index], next[target]] = [next[target], next[index]];
                      setTrustItems(next);
                      void reorder(
                        "/api/admin/trust-items/reorder",
                        next.map((row) => row.id)
                      );
                    }}
                    disabled={index === 0}
                    className="p-1 disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...trustItems];
                      const target = index + 1;
                      if (target >= next.length) return;
                      [next[index], next[target]] = [next[target], next[index]];
                      setTrustItems(next);
                      void reorder(
                        "/api/admin/trust-items/reorder",
                        next.map((row) => row.id)
                      );
                    }}
                    disabled={index === trustItems.length - 1}
                    className="p-1 disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void remove(
                        `/api/admin/trust-items/${item.id}`,
                        "Delete this trust item from every campaign?"
                      )
                    }
                    className="p-1 text-red-600"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={async () => {
                const response = await adminFetch("/api/admin/trust-items", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ icon: "verified", heading: "New Trust Point", description: "" }),
                });
                if (!response.ok) {
                  setError((await response.json()).error || "Add failed.");
                  return;
                }
                await load();
                flash("Trust item added.");
              }}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
            >
              + Add trust item
            </button>
          </>
        ) : tab === "features" ? (
          <>
            <p className="mb-3 text-xs text-gray-500">Campaigns pick exactly 3 of these for the hero feature strip.</p>
            <div className="mb-4 flex flex-col gap-2">
              {featureItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 rounded-md border border-gray-200 p-2">
                  <select
                    value={item.icon}
                    onChange={(event) => {
                      setFeatureItems((current) =>
                        current.map((row) => (row.id === item.id ? { ...row, icon: event.target.value } : row))
                      );
                      void patch(`/api/admin/feature-items/${item.id}`, { icon: event.target.value });
                    }}
                    className={`${inputClass} w-40`}
                  >
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon}>{icon}</option>
                    ))}
                  </select>
                  <input
                    value={item.label}
                    onChange={(event) => {
                      const label = event.target.value;
                      setFeatureItems((current) =>
                        current.map((row) => (row.id === item.id ? { ...row, label } : row))
                      );
                      void patch(`/api/admin/feature-items/${item.id}`, { label });
                    }}
                    placeholder="Label"
                    className={`${inputClass} flex-1`}
                  />
                  <label className="flex shrink-0 items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={item.is_active}
                      onChange={(event) => {
                        const is_active = event.target.checked;
                        setFeatureItems((current) =>
                          current.map((row) => (row.id === item.id ? { ...row, is_active } : row))
                        );
                        void patch(`/api/admin/feature-items/${item.id}`, { is_active });
                      }}
                    />
                    Available
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...featureItems];
                      const target = index - 1;
                      if (target < 0) return;
                      [next[index], next[target]] = [next[target], next[index]];
                      setFeatureItems(next);
                      void reorder(
                        "/api/admin/feature-items/reorder",
                        next.map((row) => row.id)
                      );
                    }}
                    disabled={index === 0}
                    className="p-1 disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...featureItems];
                      const target = index + 1;
                      if (target >= next.length) return;
                      [next[index], next[target]] = [next[target], next[index]];
                      setFeatureItems(next);
                      void reorder(
                        "/api/admin/feature-items/reorder",
                        next.map((row) => row.id)
                      );
                    }}
                    disabled={index === featureItems.length - 1}
                    className="p-1 disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void remove(
                        `/api/admin/feature-items/${item.id}`,
                        "Delete this feature from every campaign?"
                      )
                    }
                    className="p-1 text-red-600"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={async () => {
                const response = await adminFetch("/api/admin/feature-items", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ icon: "eco", label: "New Feature" }),
                });
                if (!response.ok) {
                  setError((await response.json()).error || "Add failed.");
                  return;
                }
                await load();
                flash("Feature item added.");
              }}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
            >
              + Add feature item
            </button>
          </>
        ) : tab === "stats" ? (
          <>
            <p className="mb-3 text-xs text-gray-500">Campaigns pick exactly 3 of these for the hero stats column.</p>
            <div className="mb-4 flex flex-col gap-2">
              {statItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 rounded-md border border-gray-200 p-2">
                  <select
                    value={item.icon}
                    onChange={(event) => {
                      setStatItems((current) =>
                        current.map((row) => (row.id === item.id ? { ...row, icon: event.target.value } : row))
                      );
                      void patch(`/api/admin/stat-items/${item.id}`, { icon: event.target.value });
                    }}
                    className={`${inputClass} w-36`}
                  >
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon}>{icon}</option>
                    ))}
                  </select>
                  <input
                    value={item.value}
                    onChange={(event) => {
                      const value = event.target.value;
                      setStatItems((current) =>
                        current.map((row) => (row.id === item.id ? { ...row, value } : row))
                      );
                      void patch(`/api/admin/stat-items/${item.id}`, { value });
                    }}
                    placeholder="50,000+"
                    className={`${inputClass} w-32`}
                  />
                  <input
                    value={item.label}
                    onChange={(event) => {
                      const label = event.target.value;
                      setStatItems((current) =>
                        current.map((row) => (row.id === item.id ? { ...row, label } : row))
                      );
                      void patch(`/api/admin/stat-items/${item.id}`, { label });
                    }}
                    placeholder="Happy Parents"
                    className={`${inputClass} flex-1`}
                  />
                  <label className="flex shrink-0 items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={item.is_active}
                      onChange={(event) => {
                        const is_active = event.target.checked;
                        setStatItems((current) =>
                          current.map((row) => (row.id === item.id ? { ...row, is_active } : row))
                        );
                        void patch(`/api/admin/stat-items/${item.id}`, { is_active });
                      }}
                    />
                    Available
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...statItems];
                      const target = index - 1;
                      if (target < 0) return;
                      [next[index], next[target]] = [next[target], next[index]];
                      setStatItems(next);
                      void reorder(
                        "/api/admin/stat-items/reorder",
                        next.map((row) => row.id)
                      );
                    }}
                    disabled={index === 0}
                    className="p-1 disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...statItems];
                      const target = index + 1;
                      if (target >= next.length) return;
                      [next[index], next[target]] = [next[target], next[index]];
                      setStatItems(next);
                      void reorder(
                        "/api/admin/stat-items/reorder",
                        next.map((row) => row.id)
                      );
                    }}
                    disabled={index === statItems.length - 1}
                    className="p-1 disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void remove(`/api/admin/stat-items/${item.id}`, "Delete this stat from every campaign?")
                    }
                    className="p-1 text-red-600"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={async () => {
                const response = await adminFetch("/api/admin/stat-items", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ icon: "group", value: "0", label: "New Stat" }),
                });
                if (!response.ok) {
                  setError((await response.json()).error || "Add failed.");
                  return;
                }
                await load();
                flash("Stat item added.");
              }}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
            >
              + Add stat item
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-xs text-gray-500">
              Suggestion pool for product card badges. Products store free text, so custom labels are also allowed.
            </p>
            <div className="mb-4 flex flex-col gap-2">
              {badgeItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 rounded-md border border-gray-200 p-2">
                  <input
                    value={item.label}
                    onChange={(event) => {
                      const label = event.target.value;
                      setBadgeItems((current) =>
                        current.map((row) => (row.id === item.id ? { ...row, label } : row))
                      );
                      void patch(`/api/admin/badge-items/${item.id}`, { label });
                    }}
                    placeholder="Badge label"
                    className={`${inputClass} flex-1`}
                  />
                  <label className="flex shrink-0 items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={item.is_active}
                      onChange={(event) => {
                        const is_active = event.target.checked;
                        setBadgeItems((current) =>
                          current.map((row) => (row.id === item.id ? { ...row, is_active } : row))
                        );
                        void patch(`/api/admin/badge-items/${item.id}`, { is_active });
                      }}
                    />
                    Available
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...badgeItems];
                      const target = index - 1;
                      if (target < 0) return;
                      [next[index], next[target]] = [next[target], next[index]];
                      setBadgeItems(next);
                      void reorder(
                        "/api/admin/badge-items/reorder",
                        next.map((row) => row.id)
                      );
                    }}
                    disabled={index === 0}
                    className="p-1 disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...badgeItems];
                      const target = index + 1;
                      if (target >= next.length) return;
                      [next[index], next[target]] = [next[target], next[index]];
                      setBadgeItems(next);
                      void reorder(
                        "/api/admin/badge-items/reorder",
                        next.map((row) => row.id)
                      );
                    }}
                    disabled={index === badgeItems.length - 1}
                    className="p-1 disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void remove(`/api/admin/badge-items/${item.id}`, "Delete this badge from the library?")
                    }
                    className="p-1 text-red-600"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={async () => {
                const response = await adminFetch("/api/admin/badge-items", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ label: "NEW BADGE" }),
                });
                if (!response.ok) {
                  setError((await response.json()).error || "Add failed.");
                  return;
                }
                await load();
                flash("Badge item added.");
              }}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
            >
              + Add badge item
            </button>
          </>
        )}
      </section>
    </div>
  );
}
