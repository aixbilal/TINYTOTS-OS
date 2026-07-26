"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-fetch";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "link",
];

export default function HelpEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams.get("id");
  const isEditing = !!articleId;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchArticle = useCallback(async () => {
    if (!articleId) return;
    setLoading(true);
    const res = await adminFetch(`/api/admin/help/${articleId}`);
    const data = await res.json();
    if (res.ok) {
      setTitle(data.article.title);
      setCategory(data.article.category);
      setDisplayOrder(String(data.article.display_order));
      setContent(data.article.content);
      setIsPublished(data.article.is_published);
    } else {
      setErrorMsg(data.error || "Failed to load article");
    }
    setLoading(false);
  }, [articleId]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const handleSave = async (publish: boolean) => {
    if (!title.trim() || !content.trim()) {
      setErrorMsg("Title and content are required.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const payload = {
        title,
        content,
        category,
        display_order: displayOrder,
        is_published: publish,
      };

      const res = isEditing
        ? await adminFetch(`/api/admin/help/${articleId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await adminFetch("/api/admin/help", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save article");

      router.push("/admin/help");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? "Edit Article" : "New Article"}
      </h1>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{errorMsg}</div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="e.g. How do I track my order?"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="e.g. shipping, returns, payments"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={quillModules}
            formats={quillFormats}
            className="bg-white"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : isPublished ? "Update & Publish" : "Publish"}
        </button>
      </div>
    </div>
  );
}