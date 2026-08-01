"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";

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

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this article permanently?")) return;
    const res = await adminFetch(`/api/admin/help/${id}`, { method: "DELETE" });
    if (res.ok) setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
          <p className="text-sm text-gray-500">Manage FAQ and support articles</p>
        </div>
        <Link
          href="/admin/help/editor"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + New Article
        </Link>
      </div>

      {errorMsg && (
        <p className="mb-4 text-sm text-red-600">{errorMsg}</p>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
          {errorMsg ? "Could not load articles." : "No articles yet."}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {articles.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{a.title}</td>
                  <td className="px-6 py-4 capitalize">{a.category}</td>
                  <td className="px-6 py-4">{a.display_order}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full font-semibold ${
                        a.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {a.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link href={`/admin/help/editor?id=${a.id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(a.id)} className="text-xs font-medium text-red-600 hover:underline">
                      Delete
                    </button>
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