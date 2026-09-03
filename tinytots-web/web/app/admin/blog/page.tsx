"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminBadge,
  AdminTableWrap,
  AdminTh,
  AdminTd,
  AdminEmptyState,
  AdminAlert,
  AdminConfirmDialog,
  AdminSubnav,
} from "@/components/admin/ui";
import { SUBNAV } from "@/lib/admin-nav";

interface Post {
  id: number;
  title: string;
  slug: string;
  category: string | null;
  author: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function AdminBlogListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await adminFetch("/api/admin/blog");
      const data = await res.json();
      if (res.ok) setPosts(data.posts || []);
      else {
        setPosts([]);
        setErrorMsg(data.error || "Failed to load posts.");
      }
    } catch {
      setPosts([]);
      setErrorMsg("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async () => {
    if (confirmId == null) return;
    setDeleting(true);
    const res = await adminFetch(`/api/admin/blog/${confirmId}`, { method: "DELETE" });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== confirmId));
    setDeleting(false);
    setConfirmId(null);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        breadcrumb={["Content", "Blog"]}
        title="Blog"
        description="Articles and updates published to /blog."
        actions={
          <Link href="/admin/blog/editor">
            <AdminButton variant="primary">
              <span className="material-symbols-outlined text-[18px]" aria-hidden>add</span>
              New post
            </AdminButton>
          </Link>
        }
      />

      <AdminSubnav items={SUBNAV.blog} />

      {errorMsg && (
        <div className="mb-4">
          <AdminAlert tone="danger">{errorMsg}</AdminAlert>
        </div>
      )}

      {loading ? (
        <p className="font-body-sm text-body-sm text-text-secondary">Loading…</p>
      ) : posts.length === 0 ? (
        <AdminCard>
          <AdminEmptyState
            icon="article"
            title={errorMsg ? "Could not load posts" : "No posts yet"}
            description={errorMsg ? undefined : "Create your first article to publish it to the blog."}
            action={
              !errorMsg ? (
                <Link href="/admin/blog/editor">
                  <AdminButton variant="primary">New post</AdminButton>
                </Link>
              ) : undefined
            }
          />
        </AdminCard>
      ) : (
        <AdminTableWrap>
          <thead>
            <tr>
              <AdminTh>Title</AdminTh>
              <AdminTh>Category</AdminTh>
              <AdminTh>Slug</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh>Created</AdminTh>
              <AdminTh className="text-right">Actions</AdminTh>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-surface-secondary">
                <AdminTd className="font-medium text-text-primary">{p.title}</AdminTd>
                <AdminTd>{p.category || "—"}</AdminTd>
                <AdminTd className="font-mono text-label-md text-text-secondary">{p.slug}</AdminTd>
                <AdminTd>
                  <AdminBadge tone={p.is_published ? "success" : "neutral"}>
                    {p.is_published ? "Published" : "Draft"}
                  </AdminBadge>
                </AdminTd>
                <AdminTd>{new Date(p.created_at).toLocaleDateString()}</AdminTd>
                <AdminTd className="text-right">
                  <span className="inline-flex items-center gap-3">
                    <Link
                      href={`/admin/blog/editor?id=${p.id}`}
                      className="font-label-md text-label-md font-medium text-brand-primary hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setConfirmId(p.id)}
                      className="font-label-md text-label-md font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </span>
                </AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTableWrap>
      )}

      {confirmId != null && (
        <AdminConfirmDialog
          title="Delete post"
          message="This permanently deletes the article. This cannot be undone."
          confirmLabel="Delete"
          danger
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
