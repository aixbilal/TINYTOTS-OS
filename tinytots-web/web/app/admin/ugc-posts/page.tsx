"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-fetch";

interface UgcPost {
  id: number;
  image_url: string;
  caption: string | null;
  instagram_handle: string | null;
  link: string | null;
  is_published: boolean;
  sort_order: number;
}

const EMPTY_FORM = { image_url: "", caption: "", instagram_handle: "", link: "", is_published: true, sort_order: 0 };

export default function AdminUgcPostsPage() {
  const [items, setItems] = useState<UgcPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/ugc-posts");
      const data = await res.json();
      if (res.ok) setItems(data.posts || []);
      else setErrorMsg(data.error || "Failed to load posts");
    } catch {
      setErrorMsg("Failed to load posts");
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
      const res = await adminFetch("/api/admin/ugc-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setForm(EMPTY_FORM);
        load();
      } else {
        setErrorMsg(data.error || "Failed to add post");
      }
    } catch {
      setErrorMsg("Failed to add post");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item: UgcPost) {
    const res = await adminFetch(`/api/admin/ugc-posts/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !item.is_published }),
    });
    if (res.ok) load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this post?")) return;
    const res = await adminFetch(`/api/admin/ugc-posts/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Shoppable Instagram / UGC Feed</h1>
      <p className="text-sm text-gray-500 mb-6">
        Manually curated customer photos shown near the footer. Paste an image URL for each post — this
        doesn't connect to Instagram automatically, so add photos as you collect them (e.g. from tagged posts).
      </p>

      {errorMsg && <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md mb-4">{errorMsg}</p>}

      <div className="border border-gray-200 rounded-lg p-5 mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Add a post</h2>
        <div className="flex flex-col gap-3">
          <input
            value={form.image_url}
            onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
            placeholder="Image URL"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          {form.image_url && (
            <div className="w-20 h-20 relative rounded-md overflow-hidden border border-gray-200">
              <Image src={form.image_url} alt="" fill className="object-cover" unoptimized />
            </div>
          )}
          <input
            value={form.caption}
            onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
            placeholder="Caption (optional)"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <div className="flex gap-3">
            <input
              value={form.instagram_handle}
              onChange={(e) => setForm((f) => ({ ...f, instagram_handle: e.target.value }))}
              placeholder="@handle (optional)"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <input
              value={form.link}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
              placeholder="Link to Instagram post (optional)"
              className="flex-[2] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !form.image_url.trim()}
            className="self-start text-sm font-medium px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add post"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="w-full aspect-square relative bg-gray-100">
                <Image src={item.image_url} alt="" fill className="object-cover" unoptimized />
              </div>
              <div className="p-2 flex flex-col gap-1">
                {item.instagram_handle && <p className="text-xs text-gray-600 truncate">{item.instagram_handle}</p>}
                <button
                  onClick={() => togglePublished(item)}
                  className={`text-xs font-medium px-2 py-1 rounded-md ${
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
          {items.length === 0 && <p className="text-sm text-gray-500 col-span-full">No posts yet.</p>}
        </div>
      )}
    </div>
  );
}
