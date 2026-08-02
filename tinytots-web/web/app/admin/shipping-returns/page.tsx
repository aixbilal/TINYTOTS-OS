"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

interface TocItem {
  id: string;
  title: string;
}

interface Timeline {
  icon: string;
  label: string;
  value: string;
}

interface CodTier {
  range: string;
  detail: string;
}

interface Step {
  icon: string;
  title: string;
  body: string;
}

interface ShippingReturnsContent {
  hero_title: string;
  hero_subtitle: string;
  toc: TocItem[];
  timelines_heading: string;
  timelines: Timeline[];
  cod_heading: string;
  cod_intro: string;
  cod_tiers: CodTier[];
  steps_heading: string;
  steps: Step[];
  contact_heading: string;
  contact_body: string;
  contact_button_text: string;
  contact_button_link: string;
}

export default function AdminShippingReturnsPage() {
  const [content, setContent] = useState<ShippingReturnsContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch("/api/admin/shipping-returns");
        const data = await res.json();
        if (res.ok) setContent(data.content);
        else setErrorMsg(data.error || "Failed to load Shipping & Returns content");
      } catch {
        setErrorMsg("Failed to load Shipping & Returns content");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateField<K extends keyof ShippingReturnsContent>(key: K, value: ShippingReturnsContent[K]) {
    setContent((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateToc(i: number, field: keyof TocItem, value: string) {
    setContent((prev) => {
      if (!prev) return prev;
      const next = [...prev.toc];
      next[i] = { ...next[i], [field]: value };
      return { ...prev, toc: next };
    });
  }

  function removeToc(i: number) {
    setContent((prev) => (prev ? { ...prev, toc: prev.toc.filter((_, idx) => idx !== i) } : prev));
  }

  function updateTimeline(i: number, field: keyof Timeline, value: string) {
    setContent((prev) => {
      if (!prev) return prev;
      const next = [...prev.timelines];
      next[i] = { ...next[i], [field]: value };
      return { ...prev, timelines: next };
    });
  }

  function updateTier(i: number, field: keyof CodTier, value: string) {
    setContent((prev) => {
      if (!prev) return prev;
      const next = [...prev.cod_tiers];
      next[i] = { ...next[i], [field]: value };
      return { ...prev, cod_tiers: next };
    });
  }

  function removeTier(i: number) {
    setContent((prev) => (prev ? { ...prev, cod_tiers: prev.cod_tiers.filter((_, idx) => idx !== i) } : prev));
  }

  function clearCodSection() {
    setContent((prev) =>
      prev ? { ...prev, cod_heading: "", cod_intro: "", cod_tiers: [] } : prev
    );
  }

  function updateStep(i: number, field: keyof Step, value: string) {
    setContent((prev) => {
      if (!prev) return prev;
      const next = [...prev.steps];
      next[i] = { ...next[i], [field]: value };
      return { ...prev, steps: next };
    });
  }

  async function handleSave() {
    if (!content) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await adminFetch("/api/admin/shipping-returns", {
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping &amp; Returns Page</h1>
          <p className="text-sm text-gray-500">
            Edit the live bento layout — hero, timeline cards, COD tiers, return steps, and contact CTA.
            Preview:{" "}
            <a href="/shipping-returns" target="_blank" rel="noreferrer" className="underline">
              /shipping-returns
            </a>
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-medium px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60 shrink-0"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {errorMsg && <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md mb-4">{errorMsg}</p>}
      {savedAt && !errorMsg && (
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md mb-4">Saved.</p>
      )}

      <div className="flex flex-col gap-8">
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Hero</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                value={content.hero_title || ""}
                onChange={(e) => updateField("hero_title", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <textarea
                value={content.hero_subtitle || ""}
                onChange={(e) => updateField("hero_subtitle", e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Contents sidebar</h2>
          <p className="text-sm text-gray-500 mb-4">
            Anchor <code className="text-xs bg-gray-100 px-1 rounded">id</code> values must match section
            anchors on the public page (e.g. delivery-timelines, returns-process).
          </p>
          <div className="flex flex-col gap-3">
            {content.toc.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={item.id}
                  onChange={(e) => updateToc(i, "id", e.target.value)}
                  placeholder="id"
                  className="w-48 border border-gray-300 rounded-md px-2 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  value={item.title}
                  onChange={(e) => updateToc(i, "title", e.target.value)}
                  placeholder="Label"
                  className="flex-1 border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  type="button"
                  onClick={() => removeToc(i)}
                  className="text-xs text-red-600 hover:underline shrink-0 px-1"
                >
                  Remove
                </button>
              </div>
            ))}
            {content.toc.length === 0 && (
              <p className="text-sm text-gray-500">No TOC entries. Add rows by saving from a previous state or reloading defaults.</p>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Delivery timeline cards</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Section heading</label>
            <input
              value={content.timelines_heading || ""}
              onChange={(e) => updateField("timelines_heading", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Icons are{" "}
            <a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer" className="underline">
              Material Symbols
            </a>{" "}
            names.
          </p>
          <div className="flex flex-col gap-3">
            {content.timelines.map((t, i) => (
              <div key={i} className="border border-gray-100 rounded-md p-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    value={t.icon}
                    onChange={(e) => updateTimeline(i, "icon", e.target.value)}
                    placeholder="icon"
                    className="w-36 border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <input
                    value={t.label}
                    onChange={(e) => updateTimeline(i, "label", e.target.value)}
                    placeholder="Label"
                    className="flex-1 border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <input
                  value={t.value}
                  onChange={(e) => updateTimeline(i, "value", e.target.value)}
                  placeholder="Value (e.g. Within 24 Hours)"
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h2 className="text-base font-semibold text-gray-900">Cash on Delivery tiers</h2>
            {content.cod_tiers.length > 0 && (
              <button
                type="button"
                onClick={clearCodSection}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Remove section
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            When no tiers remain, this block is hidden on the live page. Save after removing.
          </p>
          {content.cod_tiers.length === 0 ? (
            <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-md px-3 py-4">
              COD section is off (no tiers). It will not appear on /shipping-returns.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section heading</label>
                  <input
                    value={content.cod_heading || ""}
                    onChange={(e) => updateField("cod_heading", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Intro paragraph</label>
                  <textarea
                    value={content.cod_intro || ""}
                    onChange={(e) => updateField("cod_intro", e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {content.cod_tiers.map((tier, i) => (
                  <div key={i} className="border border-gray-100 rounded-md p-3 flex flex-col gap-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeTier(i)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove tier
                      </button>
                    </div>
                    <input
                      value={tier.range}
                      onChange={(e) => updateTier(i, "range", e.target.value)}
                      placeholder="Range (e.g. Under Rs. 5,000)"
                      className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <textarea
                      value={tier.detail}
                      onChange={(e) => updateTier(i, "detail", e.target.value)}
                      rows={2}
                      placeholder="Detail"
                      className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Return &amp; exchange steps</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Section heading</label>
            <input
              value={content.steps_heading || ""}
              onChange={(e) => updateField("steps_heading", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div className="flex flex-col gap-3">
            {content.steps.map((step, i) => (
              <div key={i} className="border border-gray-100 rounded-md p-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    value={step.icon}
                    onChange={(e) => updateStep(i, "icon", e.target.value)}
                    placeholder="icon"
                    className="w-40 border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <input
                    value={step.title}
                    onChange={(e) => updateStep(i, "title", e.target.value)}
                    placeholder="Title"
                    className="flex-1 border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <textarea
                  value={step.body}
                  onChange={(e) => updateStep(i, "body", e.target.value)}
                  rows={2}
                  placeholder="Body"
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Contact / CTA block</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
              <input
                value={content.contact_heading || ""}
                onChange={(e) => updateField("contact_heading", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <textarea
                value={content.contact_body || ""}
                onChange={(e) => updateField("contact_body", e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Button text</label>
                <input
                  value={content.contact_button_text || ""}
                  onChange={(e) => updateField("contact_button_text", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Button link</label>
                <input
                  value={content.contact_button_link || ""}
                  onChange={(e) => updateField("contact_button_link", e.target.value)}
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
