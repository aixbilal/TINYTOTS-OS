"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

interface Testimonial {
  id: number;
  customer_name: string;
  rating: number;
  quote: string;
  is_published: boolean;
  sort_order: number;
}

const EMPTY_FORM = { customer_name: "", rating: 5, quote: "", is_published: true, sort_order: 0 };

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/testimonials");
      const data = await res.json();
      if (res.ok) setItems(data.testimonials || []);
      else setErrorMsg(data.error || "Failed to load testimonials");
    } catch {
      setErrorMsg("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await adminFetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setForm(EMPTY_FORM);
        load();
      } else {
        setErrorMsg(data.error || "Failed to add testimonial");
      }
    } catch {
      setErrorMsg("Failed to add testimonial");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item: Testimonial) {
    const res = await adminFetch(`/api/admin/testimonials/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !item.is_published }),
    });
    if (res.ok) load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this testimonial?")) return;
    const res = await adminFetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Testimonials</h1>
      <p className="text-sm text-gray-500 mb-6">Manage the parent testimonials shown on the homepage.</p>

      {errorMsg && <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md mb-4">{errorMsg}</p>}

      <div className="border border-gray-200 rounded-lg p-5 mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Add a testimonial</h2>
        <div className="flex flex-col gap-3">
          <input
            value={form.customer_name}
            onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
            placeholder="Customer name"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <textarea
            value={form.quote}
            onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
            placeholder="Quote"
            rows={3}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Rating</label>
            <select
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !form.customer_name.trim() || !form.quote.trim()}
            className="self-start text-sm font-medium px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add testimonial"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {item.customer_name} — {"★".repeat(item.rating)}
                  {"☆".repeat(5 - item.rating)}
                </p>
                <p className="text-sm text-gray-600 mt-1">{item.quote}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => togglePublished(item)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md ${
                    item.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item.is_published ? "Published" : "Hidden"}
                </button>
                <button onClick={() => remove(item.id)} className="text-xs font-medium text-red-600 hover:text-red-800">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-gray-500">No testimonials yet.</p>}
        </div>
      )}
    </div>
  );
}
