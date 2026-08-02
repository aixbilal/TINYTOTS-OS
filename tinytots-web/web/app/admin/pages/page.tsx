"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";

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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Site Pages</h1>
      <p className="text-sm text-gray-500 mb-6">
        Edit Privacy Policy and Terms &amp; Conditions (Markdown/HTML + TOC). Our Story and Shipping &amp; Returns
        use their own structured editors in the sidebar.
      </p>

      {errorMsg && (
        <p className="mb-4 text-sm text-red-600">{errorMsg}</p>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
              <tr>
                <th className="px-6 py-3">Page</th>
                <th className="px-6 py-3">Slug</th>
                <th className="px-6 py-3">Last updated</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pages.map((p) => (
                <tr key={p.slug} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.title}</td>
                  <td className="px-6 py-4 font-mono text-xs">{p.slug}</td>
                  <td className="px-6 py-4">{new Date(p.updated_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/pages/${p.slug}`} className="text-xs font-medium text-indigo-600 hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
