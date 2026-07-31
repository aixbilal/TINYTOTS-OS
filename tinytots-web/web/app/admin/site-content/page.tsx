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
];
const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900";

interface TrustItem {
  id: number;
  icon: string;
  heading: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export default function AdminSiteContentPage() {
  const [items, setItems] = useState<TrustItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminFetch("/api/admin/trust-items");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to load trust items.");
      setItems(payload.items || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load trust items.");
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

  async function updateItem(id: number, updates: Partial<TrustItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    const response = await adminFetch(`/api/admin/trust-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      setError((await response.json()).error || "Save failed.");
      await load();
    }
  }

  async function addItem() {
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
  }

  async function deleteItem(id: number) {
    if (!window.confirm("Delete this trust item from every campaign?")) return;
    const response = await adminFetch(`/api/admin/trust-items/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError((await response.json()).error || "Delete failed.");
      return;
    }
    await load();
    flash("Trust item deleted.");
  }

  async function move(index: number, delta: number) {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    const response = await adminFetch("/api/admin/trust-items/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((item) => item.id) }),
    });
    if (!response.ok) {
      setError((await response.json()).error || "Reorder failed.");
      await load();
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trust Item Library</h1>
        <p className="text-sm text-gray-500">
          Maintain reusable trust points here, then select the required items inside each campaign.
        </p>
      </div>
      <section className="rounded-lg border border-gray-200 p-5">
        {message && <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-500">Loading trust items...</p>
        ) : (
          <div className="mb-4 flex flex-col gap-2">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2 rounded-md border border-gray-200 p-2">
                <select
                  value={item.icon}
                  onChange={(event) => updateItem(item.id, { icon: event.target.value })}
                  className={`${inputClass} w-40`}
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon}>{icon}</option>
                  ))}
                </select>
                <input
                  value={item.heading}
                  onChange={(event) => updateItem(item.id, { heading: event.target.value })}
                  placeholder="Heading"
                  className={`${inputClass} flex-1`}
                />
                <input
                  value={item.description}
                  onChange={(event) => updateItem(item.id, { description: event.target.value })}
                  placeholder="Description"
                  className={`${inputClass} flex-1`}
                />
                <label className="flex shrink-0 items-center gap-1 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={item.is_active}
                    onChange={(event) => updateItem(item.id, { is_active: event.target.checked })}
                  />
                  Available
                </label>
                <button onClick={() => move(index, -1)} disabled={index === 0} className="p-1 disabled:opacity-30">
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  className="p-1 disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                </button>
                <button onClick={() => deleteItem(item.id)} className="p-1 text-red-600">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={addItem} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
          + Add trust item
        </button>
      </section>
    </div>
  );
}
