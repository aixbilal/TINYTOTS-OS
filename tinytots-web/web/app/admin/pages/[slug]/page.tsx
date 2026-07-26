"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
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

const quillFormats = ["header", "bold", "italic", "underline", "strike", "list", "link"];

export default function SitePageEditor() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [saved, setSaved] = useState(false);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch(`/api/admin/pages/${slug}`);
    const data = await res.json();
    if (res.ok) {
      setTitle(data.page.title);
      setContent(data.page.content);
    } else {
      setErrorMsg(data.error || "Failed to load page");
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      setErrorMsg("Title and content are required.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSaved(false);
    try {
      const res = await adminFetch(`/api/admin/pages/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save page");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/pages" className="text-sm text-indigo-600 underline mb-4 inline-block">
        ← Back to Site Pages
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit: {title || slug}</h1>

      {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{errorMsg}</div>}

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Page title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
          <ReactQuill theme="snow" value={content} onChange={setContent} modules={quillModules} formats={quillFormats} className="bg-white" />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
      </button>
    </div>
  );
}
