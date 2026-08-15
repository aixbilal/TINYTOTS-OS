"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import AspectImageUploader from "@/components/admin/AspectImageUploader";
import { sanitizeHeroSlides, type HeroSlide } from "@/lib/hero-slides";

interface TrustItem {
  icon: string;
  label: string;
}

interface HomepageContent {
  hero_image_url: string;
  hero_image_url_mobile: string;
  hero_video_url: string;
  hero_headline: string;
  hero_subtext: string;
  hero_button_text: string;
  hero_button_link: string;
  hero_slides: HeroSlide[];
  trending_heading: string;
  trending_selection_type: "products" | "category";
  trending_category: string | null;
  trending_product_ids: number[] | null;
  stack_heading: string;
  stack_selection_type: "products" | "category";
  stack_category: string | null;
  stack_product_ids: number[] | null;
  announcement_enabled: boolean;
  announcement_text: string;
  announcement_link: string;
  announcement_style: "static" | "marquee";
  trust_items: TrustItem[];
  usp_heading: string;
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
  boys_heading: string;
  boys_button_text: string;
  boys_link: string;
  boys_selection_type: "products" | "category";
  boys_category: string | null;
  boys_product_ids: number[] | null;
  girls_image_url: string;
  girls_heading: string;
  girls_button_text: string;
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

const EMPTY_HERO_SLIDE: HeroSlide = {
  image_url: "",
  image_url_mobile: "",
  headline: "",
  subtitle: "",
  button_text: "",
  button_link: "",
};

const DEFAULT_TRUST: TrustItem[] = [
  { icon: "payments", label: "Cash on Delivery Available" },
  { icon: "local_shipping", label: "Free Delivery on All Orders" },
  { icon: "replay", label: "Easy 7-Day Returns" },
];

const DESKTOP_ASPECT = 3 / 2;
const MOBILE_ASPECT = 4 / 5;
const TILE_ASPECT = 3 / 2;

type ProductIdField =
  | "trending_product_ids"
  | "stack_product_ids"
  | "meadow_product_ids"
  | "boys_product_ids"
  | "girls_product_ids";

/** Keep editor state aligned with homepage_content columns the storefront reads. */
function normalizeHomepageContent(c: Partial<HomepageContent> & Record<string, unknown>): HomepageContent {
  const fromDb = sanitizeHeroSlides(c.hero_slides as HeroSlide[] | undefined);
  const slides =
    fromDb.length > 0
      ? fromDb.map((s, idx) => ({
          ...s,
          image_url_mobile:
            s.image_url_mobile ||
            (idx === 0 ? String(c.hero_image_url_mobile || "").replace(/^(null|undefined)$/, "") : ""),
        }))
      : [
          {
            ...EMPTY_HERO_SLIDE,
            image_url: String(c.hero_image_url || ""),
            image_url_mobile: String(c.hero_image_url_mobile || "").replace(/^(null|undefined)$/, ""),
            headline: String(c.hero_headline || ""),
            subtitle: String(c.hero_subtext || ""),
            button_text: String(c.hero_button_text || ""),
            button_link: String(c.hero_button_link || ""),
          },
        ];

  return {
    hero_image_url: String(c.hero_image_url || ""),
    hero_image_url_mobile: String(c.hero_image_url_mobile || ""),
    hero_video_url: String(c.hero_video_url || ""),
    hero_headline: String(c.hero_headline || ""),
    hero_subtext: String(c.hero_subtext || ""),
    hero_button_text: String(c.hero_button_text || ""),
    hero_button_link: String(c.hero_button_link || ""),
    hero_slides: slides,
    trending_heading: String(c.trending_heading || "Trending Now"),
    trending_selection_type: c.trending_selection_type === "category" ? "category" : "products",
    trending_category: (c.trending_category as string | null) ?? null,
    trending_product_ids: Array.isArray(c.trending_product_ids) ? c.trending_product_ids.map(Number) : [],
    stack_heading: String(c.stack_heading || "Trending Now"),
    stack_selection_type: c.stack_selection_type === "category" ? "category" : "products",
    stack_category: (c.stack_category as string | null) ?? null,
    stack_product_ids: Array.isArray(c.stack_product_ids) ? c.stack_product_ids.map(Number) : [],
    announcement_enabled: Boolean(c.announcement_enabled),
    announcement_text: String(c.announcement_text || ""),
    announcement_link: String(c.announcement_link || ""),
    announcement_style: c.announcement_style === "marquee" ? "marquee" : "static",
    trust_items:
      Array.isArray(c.trust_items) && c.trust_items.length > 0
        ? (c.trust_items as TrustItem[])
        : DEFAULT_TRUST,
    usp_heading: String(c.usp_heading || "Why Choose TinyTots"),
    usp_items: Array.isArray(c.usp_items) ? (c.usp_items as HomepageContent["usp_items"]) : [],
    meadow_image_url: String(c.meadow_image_url || ""),
    meadow_badge_text: String(c.meadow_badge_text || ""),
    meadow_heading: String(c.meadow_heading || ""),
    meadow_button_text: String(c.meadow_button_text || ""),
    meadow_link: String(c.meadow_link || "/products"),
    meadow_selection_type: c.meadow_selection_type === "products" ? "products" : "category",
    meadow_category: (c.meadow_category as string | null) ?? null,
    meadow_product_ids: Array.isArray(c.meadow_product_ids) ? c.meadow_product_ids.map(Number) : [],
    boys_image_url: String(c.boys_image_url || ""),
    boys_heading: String(c.boys_heading || "Boys"),
    boys_button_text: String(c.boys_button_text || "Shop Now"),
    boys_link: String(c.boys_link || "/products"),
    boys_selection_type: c.boys_selection_type === "products" ? "products" : "category",
    boys_category: (c.boys_category as string | null) ?? null,
    boys_product_ids: Array.isArray(c.boys_product_ids) ? c.boys_product_ids.map(Number) : [],
    girls_image_url: String(c.girls_image_url || ""),
    girls_heading: String(c.girls_heading || "Girls"),
    girls_button_text: String(c.girls_button_text || "Shop Now"),
    girls_link: String(c.girls_link || "/products"),
    girls_selection_type: c.girls_selection_type === "products" ? "products" : "category",
    girls_category: (c.girls_category as string | null) ?? null,
    girls_product_ids: Array.isArray(c.girls_product_ids) ? c.girls_product_ids.map(Number) : [],
  };
}

function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-white">
      <h2 className="text-base font-semibold text-gray-900 mb-1">{title}</h2>
      {hint && <p className="text-sm text-gray-500 mb-4">{hint}</p>}
      <div className={hint ? "" : "mt-4"}>{children}</div>
    </div>
  );
}

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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      )}
    </div>
  );
}

/** Category/product picker — mode describes how the homepage uses the selection. */
function SectionSelector({
  label,
  mode,
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
  mode: "products" | "link";
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
  const hint =
    mode === "products"
      ? "Products shown in this carousel tab on the homepage."
      : "Sets where this tile links when clicked (collection page or filtered Shop All). Does not render a product grid on the tile.";

  return (
    <div className="border border-gray-100 rounded-md p-4 bg-gray-50/60">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{label}</h3>
      <p className="text-xs text-gray-500 mb-3">{hint}</p>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => onChangeType("category")}
          className={`text-sm font-medium px-3 py-1.5 rounded-md ${
            selectionType === "category" ? "bg-gray-900 text-white" : "bg-white text-gray-700 border border-gray-200"
          }`}
        >
          By Category
        </button>
        <button
          type="button"
          onClick={() => onChangeType("products")}
          className={`text-sm font-medium px-3 py-1.5 rounded-md ${
            selectionType === "products" ? "bg-gray-900 text-white" : "bg-white text-gray-700 border border-gray-200"
          }`}
        >
          By Products
        </button>
      </div>

      {selectionType === "category" ? (
        <select
          value={category || ""}
          onChange={(e) => onChangeCategory(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
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
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                  className={`flex items-center gap-2 border rounded-md p-2 text-left transition-colors bg-white ${
                    selected ? "border-gray-900" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0 relative">
                    {p.image_url && <Image src={p.image_url} alt="" fill className="object-cover" unoptimized />}
                  </div>
                  <span className="text-sm text-gray-800 line-clamp-2">{p.name}</span>
                  {selected && (
                    <span className="material-symbols-outlined text-gray-900 text-[18px] ml-auto">check</span>
                  )}
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
          setContent(normalizeHomepageContent(data.content || {}));
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

  function toggleProduct(field: ProductIdField, id: number) {
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
        setContent(normalizeHomepageContent(data.content || {}));
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Editor</h1>
          <p className="text-sm text-gray-500">
            Each block below maps 1:1 to the live homepage. Heading + product picks for Trending grid and
            the perspective carousel are separate.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="shrink-0 text-sm font-medium px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {errorMsg && <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md mb-4">{errorMsg}</p>}
      {savedAt && !errorMsg && (
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md mb-4">Saved.</p>
      )}

      <div className="flex flex-col gap-6">
        {/* 1. Announcement (sitewide) */}
        <SectionCard
          title="1. Announcement bar"
          hint="Shown above the header on every storefront page (not homepage-only)."
        >
          <label className="flex items-center gap-2 mb-4 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={!!content.announcement_enabled}
              onChange={(e) => updateField("announcement_enabled", e.target.checked)}
            />
            Show announcement bar
          </label>
          <div className="flex flex-col gap-3">
            <TextField
              label="Text"
              value={content.announcement_text || ""}
              onChange={(v) => updateField("announcement_text", v)}
              placeholder="Free shipping on orders over Rs. 3,000"
            />
            <TextField
              label="Link (optional)"
              value={content.announcement_link || ""}
              onChange={(v) => updateField("announcement_link", v)}
              placeholder="/products"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
              <div className="flex gap-2">
                {(["static", "marquee"] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => updateField("announcement_style", style)}
                    className={`text-sm font-medium px-3 py-1.5 rounded-md ${
                      (content.announcement_style || "static") === style
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {style === "static" ? "Still" : "Scrolling loop"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 2. Hero */}
        <SectionCard
          title="2. Hero banner"
          hint="Full-bleed rotating slides. Auto-advances about every 12 seconds. Upload desktop (3:2) and mobile (4:5) crops per slide."
        >
          <div className="flex flex-col gap-4">
            {(content.hero_slides || []).map((slide, i) => (
              <div key={i} className="border border-gray-100 rounded-md p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-800">Slide {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => {
                        const next = [...content.hero_slides];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        updateField("hero_slides", next);
                      }}
                      className="p-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                      aria-label="Move slide up"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      disabled={i === content.hero_slides.length - 1}
                      onClick={() => {
                        const next = [...content.hero_slides];
                        [next[i], next[i + 1]] = [next[i + 1], next[i]];
                        updateField("hero_slides", next);
                      }}
                      className="p-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                      aria-label="Move slide down"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                    </button>
                    <button
                      type="button"
                      disabled={content.hero_slides.length <= 1}
                      onClick={() =>
                        updateField(
                          "hero_slides",
                          content.hero_slides.filter((_, idx) => idx !== i)
                        )
                      }
                      className="p-1.5 text-red-600 hover:text-red-800 disabled:opacity-30"
                      aria-label="Remove slide"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AspectImageUploader
                    label="Desktop image"
                    value={slide.image_url || ""}
                    onChange={(url) => {
                      const next = [...content.hero_slides];
                      next[i] = { ...next[i], image_url: url };
                      updateField("hero_slides", next);
                    }}
                    aspect={DESKTOP_ASPECT}
                    aspectLabel="3:2"
                    previewClassName="aspect-[3/2]"
                    outputWidth={1536}
                    outputHeight={1024}
                    variant="desktop"
                  />
                  <AspectImageUploader
                    label="Mobile image"
                    value={slide.image_url_mobile || ""}
                    onChange={(url) => {
                      const next = [...content.hero_slides];
                      next[i] = { ...next[i], image_url_mobile: url };
                      updateField("hero_slides", next);
                    }}
                    aspect={MOBILE_ASPECT}
                    aspectLabel="4:5"
                    previewClassName="aspect-[4/5]"
                    outputWidth={1122}
                    outputHeight={1402}
                    variant="mobile"
                  />
                </div>

                {(
                  [
                    ["headline", "Headline"],
                    ["subtitle", "Subtitle"],
                    ["button_text", "Button text"],
                    ["button_link", "Button link"],
                  ] as const
                ).map(([key, label]) => (
                  <TextField
                    key={key}
                    label={label}
                    value={slide[key]}
                    multiline={key === "subtitle"}
                    onChange={(v) => {
                      const next = [...content.hero_slides];
                      next[i] = { ...next[i], [key]: v };
                      updateField("hero_slides", next);
                    }}
                  />
                ))}
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateField("hero_slides", [...(content.hero_slides || []), { ...EMPTY_HERO_SLIDE }])}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 self-start"
            >
              + Add slide
            </button>
          </div>
        </SectionCard>

        {/* 3. Trust strip */}
        <SectionCard
          title="3. Trust strip"
          hint="The COD / free delivery / returns row directly under the hero."
        >
          <div className="flex flex-col gap-3">
            {(content.trust_items || []).map((item, i) => (
              <div key={i} className="flex gap-2 items-start border border-gray-100 rounded-md p-3">
                <input
                  value={item.icon}
                  onChange={(e) => {
                    const next = [...content.trust_items];
                    next[i] = { ...next[i], icon: e.target.value };
                    updateField("trust_items", next);
                  }}
                  placeholder="icon"
                  className="w-28 border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
                <input
                  value={item.label}
                  onChange={(e) => {
                    const next = [...content.trust_items];
                    next[i] = { ...next[i], label: e.target.value };
                    updateField("trust_items", next);
                  }}
                  placeholder="Label"
                  className="flex-1 border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => updateField("trust_items", content.trust_items.filter((_, idx) => idx !== i))}
                  className="text-red-600 p-2"
                  aria-label="Remove"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                updateField("trust_items", [...(content.trust_items || []), { icon: "verified", label: "" }])
              }
              className="text-sm font-medium text-gray-700 self-start"
            >
              + Add trust item
            </button>
          </div>
        </SectionCard>

        {/* 4. Trending product grid — homepage section under trust strip */}
        <SectionCard
          title="4. Trending Now — product grid"
          hint="Homepage: large heading + product cards under the trust strip. Saves to trending_heading + trending products."
        >
          <div className="flex flex-col gap-3">
            <TextField
              label="Big heading (homepage)"
              value={content.trending_heading || ""}
              onChange={(v) => updateField("trending_heading", v)}
              placeholder="Trending Now"
            />
            <SectionSelector
              label="Wire products to this grid"
              mode="products"
              selectionType={content.trending_selection_type || "products"}
              category={content.trending_category}
              productIds={content.trending_product_ids}
              categories={categories}
              products={products}
              onChangeType={(t) => updateField("trending_selection_type", t)}
              onChangeCategory={(slug) => updateField("trending_category", slug)}
              onToggleProduct={(id) => toggleProduct("trending_product_ids", id)}
            />
          </div>
        </SectionCard>

        {/* 5. Testimonials note */}
        <SectionCard title="5. Testimonials">
          <p className="text-sm text-gray-600">
            Managed separately so quotes can be reused. Edit in{" "}
            <Link href="/admin/testimonials" className="text-indigo-600 hover:underline font-medium">
              Testimonials
            </Link>
            .
          </p>
        </SectionCard>

        {/* 6. Soft Pastels Edit */}
        <SectionCard title="6. Soft Pastels Edit banner" hint="Large left tile in the bento grid.">
          <div className="flex flex-col gap-3 mb-4">
            <TextField
              label="Image URL"
              value={content.meadow_image_url || ""}
              onChange={(v) => updateField("meadow_image_url", v)}
            />
            {content.meadow_image_url && (
              <div className="w-28 h-20 relative rounded-md overflow-hidden border border-gray-200">
                <Image src={content.meadow_image_url} alt="" fill className="object-cover" unoptimized />
              </div>
            )}
            <TextField
              label="Badge text"
              value={content.meadow_badge_text || ""}
              onChange={(v) => updateField("meadow_badge_text", v)}
            />
            <TextField
              label="Heading"
              value={content.meadow_heading || ""}
              onChange={(v) => updateField("meadow_heading", v)}
            />
            <TextField
              label="Button text"
              value={content.meadow_button_text || ""}
              onChange={(v) => updateField("meadow_button_text", v)}
            />
            <TextField
              label="Fallback link"
              value={content.meadow_link || ""}
              onChange={(v) => updateField("meadow_link", v)}
              placeholder="/products"
            />
          </div>
          <SectionSelector
            label="Tile link target"
            mode="link"
            selectionType={content.meadow_selection_type || "category"}
            category={content.meadow_category}
            productIds={content.meadow_product_ids}
            categories={categories}
            products={products}
            onChangeType={(t) => updateField("meadow_selection_type", t)}
            onChangeCategory={(slug) => updateField("meadow_category", slug)}
            onToggleProduct={(id) => toggleProduct("meadow_product_ids", id)}
          />
        </SectionCard>

        {/* 7. Boys */}
        <SectionCard title="7. Boys tile" hint="Top-right tile in the bento grid.">
          <div className="flex flex-col gap-3 mb-4">
            <AspectImageUploader
              label="Tile image"
              value={content.boys_image_url || ""}
              onChange={(v) => updateField("boys_image_url", v)}
              aspect={TILE_ASPECT}
              aspectLabel="3:2"
              previewClassName="aspect-[3/2]"
              outputWidth={1536}
              outputHeight={1024}
              variant="desktop"
            />
            <TextField
              label="Heading"
              value={content.boys_heading || ""}
              onChange={(v) => updateField("boys_heading", v)}
            />
            <TextField
              label="Button text"
              value={content.boys_button_text || ""}
              onChange={(v) => updateField("boys_button_text", v)}
            />
            <TextField
              label="Fallback link"
              value={content.boys_link || ""}
              onChange={(v) => updateField("boys_link", v)}
              placeholder="/products"
            />
          </div>
          <SectionSelector
            label="Tile link target"
            mode="link"
            selectionType={content.boys_selection_type || "category"}
            category={content.boys_category}
            productIds={content.boys_product_ids}
            categories={categories}
            products={products}
            onChangeType={(t) => updateField("boys_selection_type", t)}
            onChangeCategory={(slug) => updateField("boys_category", slug)}
            onToggleProduct={(id) => toggleProduct("boys_product_ids", id)}
          />
        </SectionCard>

        {/* 8. Girls */}
        <SectionCard title="8. Girls tile" hint="Bottom-right tile in the bento grid.">
          <div className="flex flex-col gap-3 mb-4">
            <AspectImageUploader
              label="Tile image"
              value={content.girls_image_url || ""}
              onChange={(v) => updateField("girls_image_url", v)}
              aspect={TILE_ASPECT}
              aspectLabel="3:2"
              previewClassName="aspect-[3/2]"
              outputWidth={1536}
              outputHeight={1024}
              variant="desktop"
            />
            <TextField
              label="Heading"
              value={content.girls_heading || ""}
              onChange={(v) => updateField("girls_heading", v)}
            />
            <TextField
              label="Button text"
              value={content.girls_button_text || ""}
              onChange={(v) => updateField("girls_button_text", v)}
            />
            <TextField
              label="Fallback link"
              value={content.girls_link || ""}
              onChange={(v) => updateField("girls_link", v)}
              placeholder="/products"
            />
          </div>
          <SectionSelector
            label="Tile link target"
            mode="link"
            selectionType={content.girls_selection_type || "category"}
            category={content.girls_category}
            productIds={content.girls_product_ids}
            categories={categories}
            products={products}
            onChangeType={(t) => updateField("girls_selection_type", t)}
            onChangeCategory={(slug) => updateField("girls_category", slug)}
            onToggleProduct={(id) => toggleProduct("girls_product_ids", id)}
          />
        </SectionCard>

        {/* 9. Perspective card stack — independent from section 4 */}
        <SectionCard
          title="9. Trending Now — perspective carousel"
          hint="Homepage: stacked rotating cards below Soft Pastels/Boys/Girls. Own heading + product list (stack_*), not shared with the grid above."
        >
          <div className="flex flex-col gap-3">
            <TextField
              label="Big heading (homepage)"
              value={content.stack_heading || ""}
              onChange={(v) => updateField("stack_heading", v)}
              placeholder="Trending Now"
            />
            <SectionSelector
              label="Wire products to this carousel"
              mode="products"
              selectionType={content.stack_selection_type || "products"}
              category={content.stack_category}
              productIds={content.stack_product_ids}
              categories={categories}
              products={products}
              onChangeType={(t) => updateField("stack_selection_type", t)}
              onChangeCategory={(slug) => updateField("stack_category", slug)}
              onToggleProduct={(id) => toggleProduct("stack_product_ids", id)}
            />
          </div>
        </SectionCard>

        {/* 10. USP */}
        <SectionCard
          title="10. Why Choose TinyTots"
          hint={
            <>
              Icon row near the bottom of the homepage. Use{" "}
              <a
                href="https://fonts.google.com/icons"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Material Symbols
              </a>{" "}
              names (e.g. eco, verified).
            </>
          }
        >
          <div className="flex flex-col gap-3 mb-4">
            <TextField
              label="Section heading"
              value={content.usp_heading || ""}
              onChange={(v) => updateField("usp_heading", v)}
            />
          </div>
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
                  className="w-24 border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
                <input
                  value={item.title}
                  onChange={(e) => {
                    const next = [...content.usp_items];
                    next[i] = { ...next[i], title: e.target.value };
                    updateField("usp_items", next);
                  }}
                  placeholder="Title"
                  className="flex-1 border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
                <input
                  value={item.description}
                  onChange={(e) => {
                    const next = [...content.usp_items];
                    next[i] = { ...next[i], description: e.target.value };
                    updateField("usp_items", next);
                  }}
                  placeholder="Description"
                  className="flex-[2] border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => updateField("usp_items", content.usp_items.filter((_, idx) => idx !== i))}
                  className="text-red-600 p-2"
                  aria-label="Remove"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                updateField("usp_items", [...(content.usp_items || []), { icon: "star", title: "", description: "" }])
              }
              className="text-sm font-medium text-gray-700 self-start"
            >
              + Add item
            </button>
          </div>
        </SectionCard>

        {/* 11. UGC note */}
        <SectionCard title="11. Tag Us / UGC feed">
          <p className="text-sm text-gray-600">
            Shown above the footer on every page. Edit posts in{" "}
            <Link href="/admin/ugc-posts" className="text-indigo-600 hover:underline font-medium">
              UGC Posts
            </Link>
            .
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
