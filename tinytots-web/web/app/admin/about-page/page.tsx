"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-fetch";

interface Pillar {
  icon: string;
  title: string;
  body: string;
}

interface AboutContent {
  hero_image_url: string;
  hero_image_url_mobile: string;
  hero_eyebrow: string;
  hero_headline: string;
  hero_subtext: string;
  quote_text: string;
  quote_attribution: string;
  body_paragraph_1: string;
  body_paragraph_2: string;
  body_paragraph_3: string;
  section2_eyebrow: string;
  section2_headline: string;
  section2_body: string;
  section2_image_url: string;
  section2_signature: string;
  pillars: Pillar[];
  section4_eyebrow: string;
  cta_image_url: string;
  cta_heading: string;
  cta_button_text: string;
  cta_button_link: string;
}

export default function AdminAboutPage() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch("/api/admin/about-page");
        const data = await res.json();
        if (res.ok) setContent(data.content);
        else setErrorMsg(data.error || "Failed to load Our Story content");
      } catch {
        setErrorMsg("Failed to load Our Story content");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateField<K extends keyof AboutContent>(key: K, value: AboutContent[K]) {
    setContent((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updatePillar(i: number, field: keyof Pillar, value: string) {
    setContent((prev) => {
      if (!prev) return prev;
      const next = [...prev.pillars];
      next[i] = { ...next[i], [field]: value };
      return { ...prev, pillars: next };
    });
  }

  async function handleSave() {
    if (!content) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await adminFetch("/api/admin/about-page", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = await res.json();
      if (res.ok) {
        setContent(data.content);
        setSavedAt(Date.now());
      } else {
        setErrorMsg(data.error || "Failed to save changes");
      }
    } catch {
      setErrorMsg("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  if (!content) return <div className="p-6 text-sm text-red-600">{errorMsg || "Could not load content."}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Our Story Page</h1>
          <p className="text-sm text-gray-500">Edit the hero, founders quote, core pillar cards, and closing banner.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-medium px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {errorMsg && <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md mb-4">{errorMsg}</p>}
      {savedAt && !errorMsg && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md mb-4">Saved.</p>}

      <div className="flex flex-col gap-8">
        {/* Hero */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Hero Banner</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hero image URL (desktop, 16:9)</label>
              <input
                value={content.hero_image_url || ""}
                onChange={(e) => updateField("hero_image_url", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              {content.hero_image_url && (
                <div className="mt-2 w-20 h-20 relative rounded-md overflow-hidden border border-gray-200">
                  <Image src={content.hero_image_url} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hero image URL (mobile, optional - falls back to desktop crop)</label>
              <input
                value={content.hero_image_url_mobile || ""}
                onChange={(e) => updateField("hero_image_url_mobile", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eyebrow</label>
              <input
                value={content.hero_eyebrow || ""}
                onChange={(e) => updateField("hero_eyebrow", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
              <textarea
                value={content.hero_headline || ""}
                onChange={(e) => updateField("hero_headline", e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtext</label>
              <textarea
                value={content.hero_subtext || ""}
                onChange={(e) => updateField("hero_subtext", e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Founders manifesto */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Founders Quote &amp; Manifesto</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quote</label>
              <textarea
                value={content.quote_text || ""}
                onChange={(e) => updateField("quote_text", e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quote attribution</label>
              <input
                value={content.quote_attribution || ""}
                onChange={(e) => updateField("quote_attribution", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            {(["body_paragraph_1", "body_paragraph_2", "body_paragraph_3"] as const).map((key, i) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body paragraph {i + 1}</label>
                <textarea
                  value={content[key] || ""}
                  onChange={(e) => updateField(key, e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 2 — Built on love */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            &quot;Built on Love&quot; Section
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                value={content.section2_image_url || ""}
                onChange={(e) => updateField("section2_image_url", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              {content.section2_image_url && (
                <div className="mt-2 w-20 h-20 relative rounded-md overflow-hidden border border-gray-200">
                  <Image src={content.section2_image_url} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eyebrow</label>
              <input
                value={content.section2_eyebrow || ""}
                onChange={(e) => updateField("section2_eyebrow", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
              <input
                value={content.section2_headline || ""}
                onChange={(e) => updateField("section2_headline", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <textarea
                value={content.section2_body || ""}
                onChange={(e) => updateField("section2_body", e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signature line</label>
              <input
                value={content.section2_signature || ""}
                onChange={(e) => updateField("section2_signature", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Pillars */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">What We Stand For (cards)</h2>
          <p className="text-sm text-gray-500 mb-4">
            The cards shown under "What We Stand For". Icon names are{" "}
            <a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer" className="underline">
              Material Symbols
            </a>{" "}
            (e.g. eco, favorite, spa, diversity_3).
          </p>
          <div className="flex flex-col gap-3">
            {content.pillars.map((p, i) => (
              <div key={i} className="border border-gray-100 rounded-md p-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    value={p.icon}
                    onChange={(e) => updatePillar(i, "icon", e.target.value)}
                    placeholder="icon"
                    className="w-28 border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <input
                    value={p.title}
                    onChange={(e) => updatePillar(i, "title", e.target.value)}
                    placeholder="Title"
                    className="flex-1 border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setContent((prev) =>
                        prev ? { ...prev, pillars: prev.pillars.filter((_, idx) => idx !== i) } : prev
                      )
                    }
                    className="text-sm text-red-600 hover:underline shrink-0"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={p.body}
                  onChange={(e) => updatePillar(i, "body", e.target.value)}
                  rows={2}
                  placeholder="Body text"
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setContent((prev) =>
                  prev ? { ...prev, pillars: [...prev.pillars, { icon: "star", title: "", body: "" }] } : prev
                )
              }
              className="text-sm font-medium text-gray-700 border border-dashed border-gray-300 rounded-md py-2 hover:bg-gray-50"
            >
              + Add card
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">&quot;Creating Memories&quot; Closing Section</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eyebrow</label>
              <input
                value={content.section4_eyebrow || ""}
                onChange={(e) => updateField("section4_eyebrow", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                value={content.cta_image_url || ""}
                onChange={(e) => updateField("cta_image_url", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              {content.cta_image_url && (
                <div className="mt-2 w-20 h-20 relative rounded-md overflow-hidden border border-gray-200">
                  <Image src={content.cta_image_url} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
              <input
                value={content.cta_heading || ""}
                onChange={(e) => updateField("cta_heading", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Button text</label>
                <input
                  value={content.cta_button_text || ""}
                  onChange={(e) => updateField("cta_button_text", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Button link</label>
                <input
                  value={content.cta_button_link || ""}
                  onChange={(e) => updateField("cta_button_link", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
