"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-fetch";
import { BLOG_CATEGORIES, slugifyBlog } from "@/lib/blog-categories";
import DOMPurify from "dompurify";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
};

const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "align",
    "list",
    "link",
    "image",
  ];

export default function BlogEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get("id");
  const isEditing = !!postId;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    const res = await adminFetch(`/api/admin/blog/${postId}`);
    const data = await res.json();
    if (res.ok) {
      setTitle(data.post.title);
      setSlug(data.post.slug || "");
      setSlugTouched(true);
      setCategory(data.post.category || "");
      setAuthor(data.post.author || "");
      setContent(data.post.content);
      setFeaturedImageUrl(data.post.featured_image_url || "");
      setIsPublished(data.post.is_published);
    } else {
      setErrorMsg(data.error || "Failed to load post");
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Clean up the local object URL when it's replaced or the component unmounts,
  // so we don't leak memory holding onto blob references.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show the picked image instantly from the local file, before the
    // network upload even starts — no waiting to see what was picked.
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    setUploadingImage(true);
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await adminFetch("/api/admin/blog/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setFeaturedImageUrl(data.url);
    } catch (err: any) {
      setErrorMsg(err.message);
      setLocalPreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

// The real, definitive fix: sanitize whatever Quill produces down to a
  // fixed allowlist of tags with NO attributes except href/src/alt. This
  // strips every inline style, width, class, and invisible-character
  // wrapper that could have been carried in from a paste — regardless of
  // where it came from or what caused it — so the database only ever
  // stores clean, predictable HTML. No more chasing individual symptoms.
  function sanitizeContent(html: string) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "em", "u", "s",
        "h1", "h2", "h3",
        "ul", "ol", "li",
        "a", "img",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "target", "rel"],
      // Explicitly forbid the attributes that caused all of this —
      // even if a future ALLOWED_TAGS change accidentally lets more
      // elements through, these can never carry style/width/class again.
      FORBID_ATTR: ["style", "class", "width", "height"],
    }).replace(/\p{Cf}/gu, ""); // also strip any remaining invisible Unicode format chars
  }
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
        slug: slug.trim() || slugifyBlog(title),
        category: category || null,
        content,
        author,
        featured_image_url: featuredImageUrl,
        is_published: publish,
      };

      const res = isEditing
        ? await adminFetch(`/api/admin/blog/${postId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await adminFetch("/api/admin/blog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save post");

      router.push("/admin/blog");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto text-center py-12 text-gray-500">Loading...</div>;
  }

  // Prefer the instant local preview while it exists (right after picking a
  // new file); fall back to the saved URL once that's all we have (e.g. on
  // reopening an existing draft).
  const displayImage = localPreview || featuredImageUrl;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? "Edit Post" : "New Post"}
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
            onChange={(e) => {
              const next = e.target.value;
              setTitle(next);
              if (!slugTouched) setSlug(slugifyBlog(next));
            }}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Post title"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            onBlur={() => setSlug(slugifyBlog(slug))}
            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            placeholder="url-slug-for-this-post"
          />
          <p className="text-xs text-gray-500 mt-1">
            Auto-fills from the title; edit to override. Live URL: /blog/{slug || "…"}
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="">Select a category…</option>
            {BLOG_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Author (optional)</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Author name"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Featured Image</label>
          {displayImage && (
            <div className="relative w-full mb-2 group">
              <img
                src={displayImage}
                alt="Featured"
                onClick={() => setLightboxOpen(true)}
                className="w-full max-h-64 object-cover rounded-md cursor-zoom-in"
              />
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/40 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Uploading...</span>
                </div>
              )}
              {!uploadingImage && (
                <div className="absolute inset-0 rounded-md bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
              )}
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="text-sm" />
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

      {lightboxOpen && displayImage && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50 cursor-zoom-out"
        >
          <img
            src={displayImage}
            alt="Featured full size"
            className="max-w-full max-h-full rounded-md"
          />
        </div>
      )}
    </div>
  );
}