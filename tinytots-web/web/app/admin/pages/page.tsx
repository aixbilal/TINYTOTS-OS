"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import {
  AdminPageHeader,
  AdminCard,
  AdminTableWrap,
  AdminTh,
  AdminTd,
  AdminEmptyState,
  AdminAlert,
  AdminSubnav,
} from "@/components/admin/ui";
import { SUBNAV } from "@/lib/admin-nav";

interface SitePage {
  slug: string;
  title: string;
  updated_at: string;
}

export default function AdminPagesListPage() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      setErrorMsg("");
      try {
        const res = await adminFetch("/api/admin/pages");
        const data = await res.json();
        if (res.ok) setPages(data.pages || []);
        else {
          setPages([]);
          setErrorMsg(data.error || "Failed to load pages.");
        }
      } catch {
        setPages([]);
        setErrorMsg("Failed to load pages.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader
        breadcrumb={["Content", "Website"]}
        title="Site pages"
        description="Edit Privacy Policy and Terms & Conditions (Markdown/HTML + table of contents). Our Story and Shipping & Returns have their own structured editors."
      />

      <AdminSubnav items={SUBNAV.website} />

      {errorMsg && (
        <div className="mb-4">
          <AdminAlert tone="danger">{errorMsg}</AdminAlert>
        </div>
      )}

      {loading ? (
        <p className="font-body-sm text-body-sm text-text-secondary">Loading…</p>
      ) : pages.length === 0 ? (
        <AdminCard>
          <AdminEmptyState icon="description" title={errorMsg ? "Could not load pages" : "No pages found"} />
        </AdminCard>
      ) : (
        <AdminTableWrap>
          <thead>
            <tr>
              <AdminTh>Page</AdminTh>
              <AdminTh>Slug</AdminTh>
              <AdminTh>Last updated</AdminTh>
              <AdminTh className="text-right">Actions</AdminTh>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.slug} className="hover:bg-surface-secondary">
                <AdminTd className="font-medium text-text-primary">{p.title}</AdminTd>
                <AdminTd className="font-mono text-label-md text-text-secondary">{p.slug}</AdminTd>
                <AdminTd>{new Date(p.updated_at).toLocaleString()}</AdminTd>
                <AdminTd className="text-right">
                  <Link
                    href={`/admin/pages/${p.slug}`}
                    className="font-label-md text-label-md font-medium text-brand-primary hover:underline"
                  >
                    Edit
                  </Link>
                </AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTableWrap>
      )}
    </div>
  );
}
