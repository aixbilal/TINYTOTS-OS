"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import AspectImageUploader from "@/components/admin/AspectImageUploader";

interface BlogContent {
  hero_image_url: string;
  hero_image_url_mobile: string;
  hero_eyebrow: string;
  hero_headline: string;
  hero_subtext: string;
  subscribe_image_url: string;
  subscribe_headline: string;
  subscribe_subtext: string;
}

const EMPTY: BlogContent = {
  hero_image_url: "",
  hero_image_url_mobile: "",
  hero_eyebrow: "",
  hero_headline: "",
  hero_subtext: "",
  subscribe_image_url: "",
  subscribe_headline: "",
  subscribe_subtext: "",
};

function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
        />
      )}
    </label>
  );
}

export default function BlogContentAdminPage() {
  const [content, setContent] = useState<BlogContent>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch("/api/admin/blog-content");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
        setContent({ ...EMPTY, ...json.content });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load blog page content.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateField<K extends keyof BlogContent>(field: K, value: BlogContent[K]) {
    setContent((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/blog-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setContent({ ...EMPTY, ...json.content });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Blog Page Content</h1>
      <p className="text-sm text-gray-500 mb-6">
        Controls the hero banner and newsletter subscribe section on /blog. This is page-level
        content, separate from individual blog posts (managed under Blog).
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Hero banner</h2>
        <AspectImageUploader
          label="Desktop hero image"
          value={content.hero_image_url || ""}
          onChange={(v) => updateField("hero_image_url", v)}
          aspect={16 / 9}
          aspectLabel="16:9"
          previewClassName="aspect-[16/9]"
          outputWidth={1920}
          outputHeight={1080}
          variant="desktop"
        />
        <AspectImageUploader
          label="Mobile hero image (optional - falls back to desktop crop if empty)"
          value={content.hero_image_url_mobile || ""}
          onChange={(v) => updateField("hero_image_url_mobile", v)}
          aspect={4 / 5}
          aspectLabel="4:5"
          previewClassName="aspect-[4/5]"
          outputWidth={1080}
          outputHeight={1350}
          variant="mobile"
        />
        <TextField
          label="Eyebrow"
          value={content.hero_eyebrow}
          onChange={(v) => updateField("hero_eyebrow", v)}
          placeholder="The Journal"
        />
        <TextField
          label="Headline"
          value={content.hero_headline}
          onChange={(v) => updateField("hero_headline", v)}
          placeholder="Stories, style guides, and care tips."
        />
        <TextField
          label="Subtext"
          value={content.hero_subtext}
          onChange={(v) => updateField("hero_subtext", v)}
          multiline
          placeholder="For your little ones, from our family to yours."
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-5">
        <h2 className="text-lg font-semibold text-gray-900">Newsletter subscribe section</h2>
        <AspectImageUploader
          label="Subscribe thumbnail image"
          value={content.subscribe_image_url || ""}
          onChange={(v) => updateField("subscribe_image_url", v)}
          aspect={1}
          aspectLabel="1:1"
          previewClassName="aspect-square max-w-[160px]"
          outputWidth={600}
          outputHeight={600}
          variant="desktop"
        />
        <TextField
          label="Headline"
          value={content.subscribe_headline}
          onChange={(v) => updateField("subscribe_headline", v)}
          placeholder="Never miss a story."
        />
        <TextField
          label="Subtext"
          value={content.subscribe_subtext}
          onChange={(v) => updateField("subscribe_subtext", v)}
          multiline
          placeholder="Get new articles, style guides, and care tips delivered to your inbox."
        />

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-brand-primary text-white px-5 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </div>
    </div>
  );
}
