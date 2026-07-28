"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-fetch";

interface HomepageContent {
  hero_image_url: string;
  hero_image_url_mobile: string;
  hero_video_url: string;
  hero_headline: string;
  hero_subtext: string;
  hero_button_text: string;
  hero_button_link: string;
  trending_heading: string;
  trending_selection_type: "products" | "category";
  trending_category: string | null;
  trending_product_ids: number[] | null;
  newarrivals_selection_type: "products" | "category";
  newarrivals_category: string | null;
  newarrivals_product_ids: number[] | null;
  bestsellers_selection_type: "products" | "category";
  bestsellers_category: string | null;
  bestsellers_product_ids: number[] | null;
  announcement_enabled: boolean;
  announcement_text: string;
  announcement_link: string;
  usp_items: { icon: string; title: string; description: string }[];
  meadow_image_url: string;
  meadow_badge_text: string;
  meadow_heading: string;
  meadow_button_text: string;
  meadow_link: string;
  meadow_selection_type: "products" | "category";
  meadow_category: string | null;
  meadow_product_ids: number[] | null;
  boys_image_url: string;
  boys_link: string;
  boys_selection_type: "products" | "category";
  boys_category: string | null;
  boys_product_ids: number[] | null;
  girls_image_url: string;
  girls_link: string;
  girls_selection_type: "products" | "category";
  girls_category: string | null;
  girls_product_ids: number[] | null;
}

interface ProductLite {
  id: number;
  name: string;
  image_url: string | null;
}

interface CategoryLite {
  name: string;
  slug: string;
}

const FIELD_GROUPS: { title: string; fields: { key: keyof HomepageContent; label: string; type?: "text" | "textarea" }[] }[] = [
  {
    title: "Hero Banner",
    fields: [
      { key: "hero_image_url", label: "Hero image URL (desktop)" },
      { key: "hero_image_url_mobile", label: "Hero image URL (mobile — optional, falls back to desktop image if blank)" },
      { key: "hero_video_url", label: "Hero video URL (desktop only, optional — overrides the desktop image when set, e.g. an .mp4 link)" },
      { key: "hero_headline", label: "Headline" },
      { key: "hero_subtext", label: "Subtext", type: "textarea" },
      { key: "hero_button_text", label: "Button text" },
      { key: "hero_button_link", label: "Button link" },
    ],
  },
  {
    title: "The Meadow Edit (banner)",
    fields: [
      { key: "meadow_image_url", label: "Image URL" },
      { key: "meadow_badge_text", label: "Badge text" },
      { key: "meadow_heading", label: "Heading" },
      { key: "meadow_button_text", label: "Button text" },
    ],
  },
  {
    title: "Boys tile",
    fields: [{ key: "boys_image_url", label: "Boys image URL" }],
  },
  {
    title: "Girls tile",
    fields: [{ key: "girls_image_url", label: "Girls image URL" }],
  },
];

// One selection control reused for Trending Now / Meadow / Boys / Girls:
// admin picks "By Category" (auto-pulls that category's products, and the
// tile links to /collections/[slug]) or "By Products" (hand-picked list,
// links to /products?ids=...).
function SectionSelector({
  label,
  selectionType,
  category,
  productIds,
  categories,
  products,
  onChangeType,
  onChangeCategory,
  onToggleProduct,
}: {
  label: string;
  selectionType: "products" | "category";
  category: string | null;
  productIds: number[] | null;
  categories: CategoryLite[];
  products: ProductLite[];
  onChangeType: (t: "products" | "category") => void;
  onChangeCategory: (slug: string) => void;
  onToggleProduct: (id: number) => void;
}) {
  const [search, setSearch] = useState("");
  const selectedIds = new Set(productIds || []);
  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-1">{label} — products shown</h2>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => onChangeType("category")}
          className={`text-sm font-medium px-3 py-1.5 rounded-md ${
            selectionType === "category" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          By Category
        </button>
        <button
          type="button"
          onClick={() => onChangeType("products")}
          className={`text-sm font-medium px-3 py-1.5 rounded-md ${
            selectionType === "products" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          By Products
        </button>
      </div>

      {selectionType === "category" ? (
        <select
          value={category || ""}
          onChange={(e) => onChangeCategory(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Select a category...</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      ) : (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-500 mb-2">{selectedIds.size} selected</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto">
            {filteredProducts.map((p) => {
              const selected = selectedIds.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggleProduct(p.id)}
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
        </>
      )}
    </div>
  );
}

export default function AdminHomepagePage() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch("/api/admin/homepage");
        const data = await res.json();
        if (res.ok) {
          setContent(data.content);
          setProducts(data.products || []);
          setCategories(data.categories || []);
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

  function toggleProduct(
    field: "trending_product_ids" | "newarrivals_product_ids" | "bestsellers_product_ids" | "meadow_product_ids" | "boys_product_ids" | "girls_product_ids",
    id: number
  ) {
    setContent((prev) => {
      if (!prev) return prev;
      const current = prev[field] || [];
      const next = current.includes(id) ? current.filter((p) => p !== id) : [...current, id];
      return { ...prev, [field]: next };
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Editor</h1>
          <p className="text-sm text-gray-500">Edit the banners, headings, and which products show in each section.</p>
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
        {/* Announcement Bar */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Announcement Bar</h2>
          <label className="flex items-center gap-2 mb-4 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={content.announcement_enabled}
              onChange={(e) => updateField("announcement_enabled", e.target.checked as any)}
            />
            Show announcement bar above the header
          </label>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
              <input
                value={content.announcement_text || ""}
                onChange={(e) => updateField("announcement_text", e.target.value)}
                placeholder="Free shipping on orders over Rs. 3,000"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link (optional)</label>
              <input
                value={content.announcement_link || ""}
                onChange={(e) => updateField("announcement_link", e.target.value)}
                placeholder="/products"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Why Choose TinyTots (USP icons) */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Why Choose TinyTots</h2>
          <p className="text-sm text-gray-500 mb-4">
            Icons shown just below the hero. Use any{" "}
            <a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer" className="underline">
              Material Symbols
            </a>{" "}
            icon name (e.g. eco, verified, shield).
          </p>
          <div className="flex flex-col gap-3">
            {(content.usp_items || []).map((item, i) => (
              <div key={i} className="flex gap-2 items-start border border-gray-100 rounded-md p-3">
                <input
                  value={item.icon}
                  onChange={(e) => {
                    const next = [...content.usp_items];
                    next[i] = { ...next[i], icon: e.target.value };
                    updateField("usp_items", next);
                  }}
                  placeholder="icon"
                  className="w-24 border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  value={item.title}
                  onChange={(e) => {
                    const next = [...content.usp_items];
                    next[i] = { ...next[i], title: e.target.value };
                    updateField("usp_items", next);
                  }}
                  placeholder="Title"
                  className="flex-1 border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  value={item.description}
                  onChange={(e) => {
                    const next = [...content.usp_items];
                    next[i] = { ...next[i], description: e.target.value };
                    updateField("usp_items", next);
                  }}
                  placeholder="Description"
                  className="flex-[2] border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  type="button"
                  onClick={() => updateField("usp_items", content.usp_items.filter((_, idx) => idx !== i))}
                  className="text-red-600 hover:text-red-800 p-2"
                  aria-label="Remove"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateField("usp_items", [...(content.usp_items || []), { icon: "star", title: "", description: "" }])}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 self-start"
            >
              + Add item
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{FIELD_GROUPS[0].title}</h2>
          <div className="flex flex-col gap-4">
            {FIELD_GROUPS[0].fields.map((field) => (
              <FieldInput key={field.key} field={field} content={content} updateField={updateField} />
            ))}
          </div>
        </div>

        {/* Trending Now */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Trending Now</h2>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section heading</label>
          <input
            value={content.trending_heading || ""}
            onChange={(e) => updateField("trending_heading", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <SectionSelector
          label="Trending Now"
          selectionType={content.trending_selection_type || "products"}
          category={content.trending_category}
          productIds={content.trending_product_ids}
          categories={categories}
          products={products}
          onChangeType={(t) => updateField("trending_selection_type", t)}
          onChangeCategory={(slug) => updateField("trending_category", slug)}
          onToggleProduct={(id) => toggleProduct("trending_product_ids", id)}
        />
        <SectionSelector
          label="New Arrivals"
          selectionType={content.newarrivals_selection_type || "products"}
          category={content.newarrivals_category}
          productIds={content.newarrivals_product_ids}
          categories={categories}
          products={products}
          onChangeType={(t) => updateField("newarrivals_selection_type", t)}
          onChangeCategory={(slug) => updateField("newarrivals_category", slug)}
          onToggleProduct={(id) => toggleProduct("newarrivals_product_ids", id)}
        />
        <SectionSelector
          label="Bestsellers"
          selectionType={content.bestsellers_selection_type || "products"}
          category={content.bestsellers_category}
          productIds={content.bestsellers_product_ids}
          categories={categories}
          products={products}
          onChangeType={(t) => updateField("bestsellers_selection_type", t)}
          onChangeCategory={(slug) => updateField("bestsellers_category", slug)}
          onToggleProduct={(id) => toggleProduct("bestsellers_product_ids", id)}
        />

        {/* Meadow */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{FIELD_GROUPS[1].title}</h2>
          <div className="flex flex-col gap-4">
            {FIELD_GROUPS[1].fields.map((field) => (
              <FieldInput key={field.key} field={field} content={content} updateField={updateField} />
            ))}
          </div>
        </div>
        <SectionSelector
          label="The Meadow Edit"
          selectionType={content.meadow_selection_type || "category"}
          category={content.meadow_category}
          productIds={content.meadow_product_ids}
          categories={categories}
          products={products}
          onChangeType={(t) => updateField("meadow_selection_type", t)}
          onChangeCategory={(slug) => updateField("meadow_category", slug)}
          onToggleProduct={(id) => toggleProduct("meadow_product_ids", id)}
        />

        {/* Boys */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{FIELD_GROUPS[2].title}</h2>
          <div className="flex flex-col gap-4">
            {FIELD_GROUPS[2].fields.map((field) => (
              <FieldInput key={field.key} field={field} content={content} updateField={updateField} />
            ))}
          </div>
        </div>
        <SectionSelector
          label="Boys"
          selectionType={content.boys_selection_type || "category"}
          category={content.boys_category}
          productIds={content.boys_product_ids}
          categories={categories}
          products={products}
          onChangeType={(t) => updateField("boys_selection_type", t)}
          onChangeCategory={(slug) => updateField("boys_category", slug)}
          onToggleProduct={(id) => toggleProduct("boys_product_ids", id)}
        />

        {/* Girls */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{FIELD_GROUPS[3].title}</h2>
          <div className="flex flex-col gap-4">
            {FIELD_GROUPS[3].fields.map((field) => (
              <FieldInput key={field.key} field={field} content={content} updateField={updateField} />
            ))}
          </div>
        </div>
        <SectionSelector
          label="Girls"
          selectionType={content.girls_selection_type || "category"}
          category={content.girls_category}
          productIds={content.girls_product_ids}
          categories={categories}
          products={products}
          onChangeType={(t) => updateField("girls_selection_type", t)}
          onChangeCategory={(slug) => updateField("girls_category", slug)}
          onToggleProduct={(id) => toggleProduct("girls_product_ids", id)}
        />
      </div>
    </div>
  );
}

function FieldInput({
  field,
  content,
  updateField,
}: {
  field: { key: keyof HomepageContent; label: string; type?: "text" | "textarea" };
  content: HomepageContent;
  updateField: <K extends keyof HomepageContent>(key: K, value: HomepageContent[K]) => void;
}) {
  return (
    <div>
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
  );
}
