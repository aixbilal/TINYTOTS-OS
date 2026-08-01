"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";

interface Post {
  id: number;
  title: string;
  slug: string;
  author: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function AdminBlogListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

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

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this post permanently?")) return;
    const res = await adminFetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500">Manage articles and updates</p>
        </div>
        <Link
          href="/admin/blog/editor"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + New Post
        </Link>
      </div>

      {errorMsg && (
        <p className="mb-4 text-sm text-red-600">{errorMsg}</p>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
          {errorMsg ? "Could not load posts." : "No posts yet."}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Author</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.title}</td>
                  <td className="px-6 py-4">{p.author || "—"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full font-semibold ${
                        p.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {p.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link href={`/admin/blog/editor?id=${p.id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(p.id)} className="text-xs font-medium text-red-600 hover:underline">
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