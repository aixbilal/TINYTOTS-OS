"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-fetch";

interface HomepageContent {
  hero_image_url: string;
  hero_headline: string;
  hero_subtext: string;
  hero_button_text: string;
  hero_button_link: string;
  trending_heading: string;
  trending_product_ids: number[] | null;
  meadow_image_url: string;
  meadow_badge_text: string;
  meadow_heading: string;
  meadow_button_text: string;
  meadow_link: string;
  boys_image_url: string;
  boys_link: string;
  girls_image_url: string;
  girls_link: string;
}

interface ProductLite {
  id: number;
  name: string;
  image_url: string | null;
}

const FIELD_GROUPS: { title: string; fields: { key: keyof HomepageContent; label: string; type?: "text" | "textarea" }[] }[] = [
  {
    title: "Hero Banner",
    fields: [
      { key: "hero_image_url", label: "Hero image URL" },
      { key: "hero_headline", label: "Headline" },
      { key: "hero_subtext", label: "Subtext", type: "textarea" },
      { key: "hero_button_text", label: "Button text" },
      { key: "hero_button_link", label: "Button link" },
    ],
  },
  {
    title: "Trending Now",
    fields: [{ key: "trending_heading", label: "Section heading" }],
  },
  {
    title: "The Meadow Edit (banner)",
    fields: [
      { key: "meadow_image_url", label: "Image URL" },
      { key: "meadow_badge_text", label: "Badge text" },
      { key: "meadow_heading", label: "Heading" },
      { key: "meadow_button_text", label: "Button text" },
      { key: "meadow_link", label: "Button link" },
    ],
  },
  {
    title: "Boys / Girls category tiles",
    fields: [
      { key: "boys_image_url", label: "Boys image URL" },
      { key: "boys_link", label: "Boys link" },
      { key: "girls_image_url", label: "Girls image URL" },
      { key: "girls_link", label: "Girls link" },
    ],
  },
];

export default function AdminHomepagePage() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch("/api/admin/homepage");
        const data = await res.json();
        if (res.ok) {
          setContent(data.content);
          setProducts(data.products || []);
        } else {
          setErrorMsg(data.error || "Failed to load homepage content");
        }
      } catch {
        setErrorMsg("Failed to load homepage content");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateField<K extends keyof HomepageContent>(key: K, value: HomepageContent[K]) {
    setContent((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function toggleTrendingProduct(id: number) {
    setContent((prev) => {
      if (!prev) return prev;
      const current = prev.trending_product_ids || [];
      const next = current.includes(id) ? current.filter((p) => p !== id) : [...current, id];
      return { ...prev, trending_product_ids: next };
    });
  }

  async function handleSave() {
    if (!content) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await adminFetch("/api/admin/homepage", {
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

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading homepage content...</div>;
  if (!content) return <div className="p-6 text-sm text-red-600">{errorMsg || "Could not load homepage content."}</div>;

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  const selectedIds = new Set(content.trending_product_ids || []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Editor</h1>
          <p className="text-sm text-gray-500">Edit the banners, headings, and trending products shown on the storefront homepage.</p>
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
      {savedAt && !errorMsg && (
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md mb-4">Saved.</p>
      )}

      <div className="flex flex-col gap-8">
        {FIELD_GROUPS.map((group) => (
          <div key={group.title} className="border border-gray-200 rounded-lg p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">{group.title}</h2>
            <div className="flex flex-col gap-4">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={(content[field.key] as string) || ""}
                      onChange={(e) => updateField(field.key, e.target.value as any)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  ) : (
                    <input
                      value={(content[field.key] as string) || ""}
                      onChange={(e) => updateField(field.key, e.target.value as any)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  )}
                  {field.key.toString().includes("image_url") && content[field.key] && (
                    <div className="mt-2 w-20 h-20 relative rounded-md overflow-hidden border border-gray-200">
                      <Image src={content[field.key] as string} alt="" fill className="object-cover" unoptimized />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Trending Now — products</h2>
          <p className="text-sm text-gray-500 mb-4">
            Pick which products appear in the Trending Now section. Leave none selected to fall back to the most
            recently added products automatically.
          </p>
          <input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-500 mb-2">{selectedIds.size} selected</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {filteredProducts.map((p) => {
              const selected = selectedIds.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleTrendingProduct(p.id)}
                  className={`flex items-center gap-2 border rounded-md p-2 text-left transition-colors ${
                    selected ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0 relative">
                    {p.image_url && <Image src={p.image_url} alt="" fill className="object-cover" unoptimized />}
                  </div>
                  <span className="text-sm text-gray-800 line-clamp-2">{p.name}</span>
                  {selected && <span className="material-symbols-outlined text-gray-900 text-[18px] ml-auto">check</span>}
                </button>
              );
            })}
            {filteredProducts.length === 0 && (
              <p className="text-sm text-gray-500 col-span-full">No products match your search.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
