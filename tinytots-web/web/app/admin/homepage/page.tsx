"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

export default function AdminHomepagePage() {
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubtext, setHeroSubtext] = useState("");
  const [heroButtonText, setHeroButtonText] = useState("");
  const [heroButtonLink, setHeroButtonLink] = useState("");
  const [trendingHeading, setTrendingHeading] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await adminFetch("/api/admin/homepage");
      const data = await res.json();
      if (res.ok) {
        setHeroImageUrl(data.content.hero_image_url);
        setHeroHeadline(data.content.hero_headline);
        setHeroSubtext(data.content.hero_subtext);
        setHeroButtonText(data.content.hero_button_text);
        setHeroButtonLink(data.content.hero_button_link);
        setTrendingHeading(data.content.trending_heading);
      } else {
        setErrorMsg(data.error || "Failed to load homepage content");
      }
      setLoading(false);
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    setErrorMsg("");
    setSaved(false);
    const res = await adminFetch("/api/admin/homepage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hero_image_url: heroImageUrl,
        hero_headline: heroHeadline,
        hero_subtext: heroSubtext,
        hero_button_text: heroButtonText,
        hero_button_link: heroButtonLink,
        trending_heading: trendingHeading,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Failed to save");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  const inputClass = "w-full border rounded-md px-3 py-2 text-sm";

  if (loading) {
    return <div className="max-w-2xl mx-auto text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Homepage</h1>
      <p className="text-sm text-gray-500 mb-6">
        Edit the hero banner and "Trending Now" section shown on the storefront homepage.
      </p>

      {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{errorMsg}</div>}

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col gap-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Hero banner</h2>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Background image URL</label>
          <input value={heroImageUrl} onChange={(e) => setHeroImageUrl(e.target.value)} className={inputClass} />
          {heroImageUrl && (
            <img src={heroImageUrl} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-md border" />
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Headline</label>
          <input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Subtext</label>
          <textarea
            value={heroSubtext}
            onChange={(e) => setHeroSubtext(e.target.value)}
            rows={2}
            className={inputClass}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Button text</label>
            <input value={heroButtonText} onChange={(e) => setHeroButtonText(e.target.value)} className={inputClass} />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Button link</label>
            <input
              value={heroButtonLink}
              onChange={(e) => setHeroButtonLink(e.target.value)}
              placeholder="e.g. #trending or /products"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col gap-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-900">Trending section</h2>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Section heading</label>
          <input value={trendingHeading} onChange={(e) => setTrendingHeading(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
      </div>
    </div>
  );
}
