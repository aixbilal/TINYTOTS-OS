"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { helpCategoryLabel } from "@/lib/help-categories";
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

interface Article {
  id: number;
  title: string;
  slug: string;
  category: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
}

export default function AdminHelpListPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await adminFetch("/api/admin/help");
      const data = await res.json();
      if (res.ok) setArticles(data.articles || []);
      else {
        setArticles([]);
        setErrorMsg(data.error || "Failed to load articles.");
      }
    } catch {
      setArticles([]);
      setErrorMsg("Failed to load articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleDelete = async () => {
    if (confirmId == null) return;
    setDeleting(true);
    const res = await adminFetch(`/api/admin/help/${confirmId}`, { method: "DELETE" });
    if (res.ok) setArticles((prev) => prev.filter((a) => a.id !== confirmId));
    setDeleting(false);
    setConfirmId(null);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        breadcrumb={["Content", "Help Center"]}
        title="Help Center"
        description="FAQ and support articles published to /help."
        actions={
          <Link href="/admin/help/editor">
            <AdminButton variant="primary">
              <span className="material-symbols-outlined text-[18px]" aria-hidden>add</span>
              New article
            </AdminButton>
          </Link>
        }
      />

      <AdminSubnav items={SUBNAV.help} />

      {errorMsg && (
        <div className="mb-4">
          <AdminAlert tone="danger">{errorMsg}</AdminAlert>
        </div>
      )}

      {loading ? (
        <p className="font-body-sm text-body-sm text-text-secondary">Loading…</p>
      ) : articles.length === 0 ? (
        <AdminCard>
          <AdminEmptyState
            icon="help_center"
            title={errorMsg ? "Could not load articles" : "No articles yet"}
            description={errorMsg ? undefined : "Add your first Help Center article."}
            action={
              !errorMsg ? (
                <Link href="/admin/help/editor">
                  <AdminButton variant="primary">New article</AdminButton>
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
              <AdminTh>Order</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh className="text-right">Actions</AdminTh>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="hover:bg-surface-secondary">
                <AdminTd className="font-medium text-text-primary">{a.title}</AdminTd>
                <AdminTd>{helpCategoryLabel(a.category)}</AdminTd>
                <AdminTd>{a.display_order}</AdminTd>
                <AdminTd>
                  <AdminBadge tone={a.is_published ? "success" : "neutral"}>
                    {a.is_published ? "Published" : "Draft"}
                  </AdminBadge>
                </AdminTd>
                <AdminTd className="text-right">
                  <span className="inline-flex items-center gap-3">
                    <Link
                      href={`/admin/help/editor?id=${a.id}`}
                      className="font-label-md text-label-md font-medium text-brand-primary hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setConfirmId(a.id)}
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
          title="Delete article"
          message="This permanently deletes the Help Center article. This cannot be undone."
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
