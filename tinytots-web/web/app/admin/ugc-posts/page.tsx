"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-fetch";
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminAlert,
  AdminSubnav,
  adminInputClass,
} from "@/components/admin/ui";
import { SUBNAV } from "@/lib/admin-nav";

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
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader
        breadcrumb={["Content", "Social proof"]}
        title="Instagram & UGC"
        description="Manually curated customer photos shown near the footer. Paste an image URL for each post — this doesn't connect to Instagram automatically, so add photos as you collect them (e.g. from tagged posts)."
      />

      <AdminSubnav items={SUBNAV.socialProof} />

      {errorMsg && (
        <div className="mb-4">
          <AdminAlert tone="danger">{errorMsg}</AdminAlert>
        </div>
      )}

      <AdminCard title="Add a post" className="mb-8">
        <div className="flex flex-col gap-3">
          <input
            value={form.image_url}
            onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
            placeholder="Image URL"
            className={adminInputClass}
          />
          {form.image_url && (
            <div className="relative h-20 w-20 overflow-hidden rounded-md border border-border-default">
              <Image src={form.image_url} alt="" fill className="object-cover" unoptimized />
            </div>
          )}
          <input
            value={form.caption}
            onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
            placeholder="Caption (optional)"
            className={adminInputClass}
          />
          <div className="flex gap-3">
            <input
              value={form.instagram_handle}
              onChange={(e) => setForm((f) => ({ ...f, instagram_handle: e.target.value }))}
              placeholder="@handle (optional)"
              className={`flex-1 ${adminInputClass}`}
            />
            <input
              value={form.link}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
              placeholder="Link to Instagram post (optional)"
              className={`flex-[2] ${adminInputClass}`}
            />
          </div>
          <AdminButton
            variant="primary"
            onClick={handleAdd}
            disabled={saving || !form.image_url.trim()}
            className="self-start"
          >
            {saving ? "Adding…" : "Add post"}
          </AdminButton>
        </div>
      </AdminCard>

      {loading ? (
        <p className="font-body-sm text-body-sm text-text-secondary">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-lg border border-border-default bg-surface-elevated">
              <div className="relative aspect-square w-full bg-surface-secondary">
                <Image src={item.image_url} alt="" fill className="object-cover" unoptimized />
              </div>
              <div className="flex flex-col gap-1 p-2">
                {item.instagram_handle && (
                  <p className="truncate font-label-md text-label-md text-text-secondary">{item.instagram_handle}</p>
                )}
                <button
                  onClick={() => togglePublished(item)}
                  className={`rounded-md px-2 py-1 font-label-md text-label-md font-medium ${
                    item.is_published ? "bg-green-100 text-green-800" : "bg-surface-secondary text-text-secondary"
                  }`}
                >
                  {item.is_published ? "Published" : "Hidden"}
                </button>
                <button
                  onClick={() => remove(item.id)}
                  className="font-label-md text-label-md font-medium text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="col-span-full font-body-sm text-body-sm text-text-secondary">No posts yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
