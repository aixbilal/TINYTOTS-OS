"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-fetch";

interface Testimonial {
  id: number;
  customer_name: string;
  customer_image_url: string | null;
  rating: number;
  quote: string;
  is_published: boolean;
  sort_order: number;
}

const EMPTY_FORM = { customer_name: "", rating: 5, quote: "", is_published: true, sort_order: 0 };
const inputClass =
  "border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900";

/* ------------------------------------------------------------------
 * Photo upload — only usable once the testimonial has a real id (i.e.
 * after it's been created), since the upload writes straight to its row.
 * ------------------------------------------------------------------ */
function PhotoUpload({
  testimonialId,
  value,
  onUploaded,
  onDeleted,
}: {
  testimonialId: number;
  value: string | null;
  onUploaded: (url: string) => void;
  onDeleted: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await adminFetch(`/api/admin/testimonials/${testimonialId}/photo`, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) onUploaded(data.url);
      else setError(data.error || "Upload failed");
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    setUploading(true);
    setError("");
    try {
      const res = await adminFetch(`/api/admin/testimonials/${testimonialId}/photo`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) onDeleted();
      else setError(data.error || "Delete failed");
    } catch {
      setError("Delete failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 border border-gray-200 relative shrink-0">
        {value ? (
          <Image src={value} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="material-symbols-outlined text-[20px]">person</span>
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs font-medium text-gray-700 hover:text-gray-900 disabled:opacity-60"
        >
          {uploading ? "Uploading..." : value ? "Replace photo" : "Add photo"}
        </button>
        {value && (
          <button
            type="button"
            onClick={removePhoto}
            disabled={uploading}
            className="text-left text-xs font-medium text-red-600 disabled:opacity-60"
          >
            Remove photo
          </button>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
    </div>
  );
}

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function handleAdd() {
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await adminFetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sort_order: items.length }),
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

  async function updateItem(id: number, updates: Partial<Testimonial>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
    await adminFetch(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  async function togglePublished(item: Testimonial) {
    updateItem(item.id, { is_published: !item.is_published });
  }

  async function remove(id: number) {
    if (!confirm("Delete this testimonial?")) return;
    const res = await adminFetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function move(index: number, delta: number) {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    await Promise.all(next.map((it, i) => adminFetch(`/api/admin/testimonials/${it.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sort_order: i }),
    })));
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Testimonials</h1>
      <p className="text-sm text-gray-500 mb-6">
        Shown on the homepage and rotate automatically on the /signage testimonial carousel.
      </p>

      {errorMsg && <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md mb-4">{errorMsg}</p>}

      <div className="border border-gray-200 rounded-lg p-5 mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Add a testimonial</h2>
        <div className="flex flex-col gap-3">
          <input
            value={form.customer_name}
            onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
            placeholder="Customer name"
            className={inputClass}
          />
          <textarea
            value={form.quote}
            onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
            placeholder="Quote"
            rows={3}
            className={inputClass}
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Rating</label>
            <select
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
              className={`${inputClass} py-1.5`}
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500">
            A photo can be added right after creating the testimonial, from the list below.
          </p>
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
          {items.map((item, i) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex items-start gap-4">
              <PhotoUpload
                testimonialId={item.id}
                value={item.customer_image_url}
                onUploaded={(url) => updateItem(item.id, { customer_image_url: url })}
                onDeleted={() => updateItem(item.id, { customer_image_url: null })}
              />

              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    value={item.customer_name}
                    onChange={(e) => setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, customer_name: e.target.value } : it)))}
                    onBlur={(e) => updateItem(item.id, { customer_name: e.target.value })}
                    className={`${inputClass} font-medium flex-1`}
                  />
                  <select
                    value={item.rating}
                    onChange={(e) => updateItem(item.id, { rating: Number(e.target.value) })}
                    className={`${inputClass} py-1`}
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r}★
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={item.quote}
                  onChange={(e) => setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, quote: e.target.value } : it)))}
                  onBlur={(e) => updateItem(item.id, { quote: e.target.value })}
                  rows={2}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2 shrink-0 items-end">
                <button
                  onClick={() => togglePublished(item)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md ${
                    item.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item.is_published ? "Published" : "Hidden"}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-400 hover:text-gray-900 disabled:opacity-30 p-1">
                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    className="text-gray-400 hover:text-gray-900 disabled:opacity-30 p-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  </button>
                </div>
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