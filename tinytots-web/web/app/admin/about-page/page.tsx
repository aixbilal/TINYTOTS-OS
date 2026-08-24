"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import AspectImageUploader from "@/components/admin/AspectImageUploader";

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

function TextInput({
  label,
  value,
  onChange,
  multiline,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      ) : (
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      )}
    </div>
  );
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
          <p className="text-sm text-gray-500">
            Grouped to match the live page top to bottom: Hero, From the Beginning, Pillars, Closing CTA.
          </p>
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
        {/* 1. Hero */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">1. Hero Banner</h2>
          <div className="flex flex-col gap-4">
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
            <TextInput label="Eyebrow" value={content.hero_eyebrow} onChange={(v) => updateField("hero_eyebrow", v)} />
            <TextInput
              label="Headline"
              value={content.hero_headline}
              onChange={(v) => updateField("hero_headline", v)}
              multiline
            />
            <TextInput
              label="Subtext"
              value={content.hero_subtext}
              onChange={(v) => updateField("hero_subtext", v)}
              multiline
            />
            <TextInput
              label="Supporting paragraph (shown below subtext, same hero block)"
              value={content.body_paragraph_1}
              onChange={(v) => updateField("body_paragraph_1", v)}
              multiline
              rows={3}
            />
          </div>
        </div>

        {/* 2. From the Beginning */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">2. &quot;From the Beginning&quot; Section</h2>
          <div className="flex flex-col gap-4">
            <AspectImageUploader
              label="Section image"
              value={content.section2_image_url || ""}
              onChange={(v) => updateField("section2_image_url", v)}
              aspect={1}
              aspectLabel="1:1"
              previewClassName="aspect-square max-w-xs"
              outputWidth={1200}
              outputHeight={1200}
              variant="desktop"
            />
            <TextInput
              label="Eyebrow"
              value={content.section2_eyebrow}
              onChange={(v) => updateField("section2_eyebrow", v)}
            />
            <TextInput
              label="Headline"
              value={content.section2_headline}
              onChange={(v) => updateField("section2_headline", v)}
            />
            <TextInput
              label="Body"
              value={content.section2_body}
              onChange={(v) => updateField("section2_body", v)}
              multiline
              rows={3}
            />
            <TextInput
              label="Signature line"
              value={content.section2_signature}
              onChange={(v) => updateField("section2_signature", v)}
            />
          </div>
        </div>

        {/* 3. Pillars */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">3. What We Stand For (cards)</h2>
          <p className="text-sm text-gray-500 mb-4">
            The cards shown under &quot;What We Stand For&quot;. Icon names are{" "}
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

        {/* 4. CTA */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">4. &quot;Creating Memories&quot; Closing Section</h2>
          <div className="flex flex-col gap-4">
            <AspectImageUploader
              label="Full-bleed banner image"
              value={content.cta_image_url || ""}
              onChange={(v) => updateField("cta_image_url", v)}
              aspect={16 / 9}
              aspectLabel="16:9"
              previewClassName="aspect-[16/9]"
              outputWidth={1920}
              outputHeight={1080}
              variant="desktop"
            />
            <TextInput
              label="Eyebrow"
              value={content.section4_eyebrow}
              onChange={(v) => updateField("section4_eyebrow", v)}
            />
            <TextInput label="Heading" value={content.cta_heading} onChange={(v) => updateField("cta_heading", v)} />
            <TextInput
              label="Supporting paragraph"
              value={content.body_paragraph_2}
              onChange={(v) => updateField("body_paragraph_2", v)}
              multiline
              rows={3}
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <TextInput
                  label="Button text"
                  value={content.cta_button_text}
                  onChange={(v) => updateField("cta_button_text", v)}
                />
              </div>
              <div className="flex-1">
                <TextInput
                  label="Button link"
                  value={content.cta_button_link}
                  onChange={(v) => updateField("cta_button_link", v)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Not currently shown on the live page - kept, not deleted */}
        <div className="border border-dashed border-gray-300 rounded-lg p-5 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-700 mb-1">Stored but not shown on the live page</h2>
          <p className="text-sm text-gray-500 mb-4">
            These fields still exist in the database and can be edited here, but the current About page
            design does not render them anywhere. Left in place rather than removed.
          </p>
          <div className="flex flex-col gap-4">
            <TextInput label="Quote" value={content.quote_text} onChange={(v) => updateField("quote_text", v)} multiline rows={3} />
            <TextInput
              label="Quote attribution"
              value={content.quote_attribution}
              onChange={(v) => updateField("quote_attribution", v)}
            />
            <TextInput
              label="Body paragraph 3"
              value={content.body_paragraph_3}
              onChange={(v) => updateField("body_paragraph_3", v)}
              multiline
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
