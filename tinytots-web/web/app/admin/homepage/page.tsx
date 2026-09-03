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
  new_arrivals_image_url: string;
  new_arrivals_heading: string;
  new_arrivals_button_text: string;
  new_arrivals_link: string;
  new_arrivals_selection_type: "products" | "category";
  new_arrivals_category: string | null;
  new_arrivals_product_ids: number[] | null;
  editorial_eyebrow: string;
  editorial_headline: string;
  editorial_body: string;
  editorial_image_url: string;
  editorial_cta_text: string;
  editorial_cta_link: string;
  lifestyle_1_eyebrow: string;
  lifestyle_1_headline: string;
  lifestyle_1_body: string;
  lifestyle_1_image_url: string;
  lifestyle_1_cta_text: string;
  lifestyle_1_cta_link: string;
  lifestyle_2_eyebrow: string;
  lifestyle_2_headline: string;
  lifestyle_2_body: string;
  lifestyle_2_image_url: string;
  lifestyle_2_cta_text: string;
  lifestyle_2_cta_link: string;
  closing_cta_image_url: string;
  closing_cta_headline: string;
  closing_cta_subtext: string;
  closing_cta_button_text: string;
  closing_cta_button_link: string;
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
  eyebrow: "",
  image_url: "",
  image_url_mobile: "",
  headline: "",
  subtitle: "",
  button_text: "",
  button_link: "",
  button_text_secondary: "",
  button_link_secondary: "",
};

const DEFAULT_TRUST: TrustItem[] = [
  { icon: "payments", label: "Cash on Delivery Available" },
  { icon: "local_shipping", label: "Free Delivery on All Orders" },
  { icon: "replay", label: "Easy 7-Day Returns" },
];

const DESKTOP_ASPECT = 16 / 9;
const MOBILE_ASPECT = 4 / 5;
const TILE_ASPECT = 3 / 2;

type ProductIdField =
  | "trending_product_ids"
  | "meadow_product_ids"
  | "boys_product_ids"
  | "girls_product_ids"
  | "new_arrivals_product_ids";

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
    new_arrivals_image_url: String(c.new_arrivals_image_url || ""),
    new_arrivals_heading: String(c.new_arrivals_heading || "New Arrivals"),
    new_arrivals_button_text: String(c.new_arrivals_button_text || "Shop Now"),
    new_arrivals_link: String(c.new_arrivals_link || "/products?sort=newest"),
    new_arrivals_selection_type: c.new_arrivals_selection_type === "products" ? "products" : "category",
    new_arrivals_category: (c.new_arrivals_category as string | null) ?? null,
    new_arrivals_product_ids: Array.isArray(c.new_arrivals_product_ids)
      ? c.new_arrivals_product_ids.map(Number)
      : [],
    editorial_eyebrow: String(c.editorial_eyebrow || "Made With Heart"),
    editorial_headline: String(c.editorial_headline || "Designed with love. Made for childhood."),
    editorial_body: String(c.editorial_body || ""),
    editorial_image_url: String(c.editorial_image_url || ""),
    editorial_cta_text: String(c.editorial_cta_text || "Our Story"),
    editorial_cta_link: String(c.editorial_cta_link || "/our-story"),
    lifestyle_1_eyebrow: String(c.lifestyle_1_eyebrow || "Rooted In Quality"),
    lifestyle_1_headline: String(c.lifestyle_1_headline || "Beautiful pieces for real life."),
    lifestyle_1_body: String(c.lifestyle_1_body || ""),
    lifestyle_1_image_url: String(c.lifestyle_1_image_url || ""),
    lifestyle_1_cta_text: String(c.lifestyle_1_cta_text || "Learn More"),
    lifestyle_1_cta_link: String(c.lifestyle_1_cta_link || "/our-story"),
    lifestyle_2_eyebrow: String(c.lifestyle_2_eyebrow || "Made For Together"),
    lifestyle_2_headline: String(c.lifestyle_2_headline || "For the moments that matter."),
    lifestyle_2_body: String(c.lifestyle_2_body || ""),
    lifestyle_2_image_url: String(c.lifestyle_2_image_url || ""),
    lifestyle_2_cta_text: String(c.lifestyle_2_cta_text || "Explore More"),
    lifestyle_2_cta_link: String(c.lifestyle_2_cta_link || "/products"),
    closing_cta_image_url: String(c.closing_cta_image_url || ""),
    closing_cta_headline: String(c.closing_cta_headline || "Made to be memories. Beautiful always."),
    closing_cta_subtext: String(c.closing_cta_subtext || "Styles today. Memories forever."),
    closing_cta_button_text: String(c.closing_cta_button_text || "Shop the Collection"),
    closing_cta_button_link: String(c.closing_cta_button_link || "/products"),
  };
}

// Section jump targets for the sticky editor toolbar. The order + numbering
// match the numbered <SectionCard title="N. …"> blocks below 1:1.
const HP_SECTIONS: { n: number; label: string }[] = [
  { n: 1, label: "Hero" },
  { n: 2, label: "Announcement" },
  { n: 3, label: "Trending" },
  { n: 4, label: "Editorial" },
  { n: 5, label: "Girls card" },
  { n: 6, label: "Boys card" },
  { n: 7, label: "New Arrivals" },
  { n: 8, label: "Campaign banner" },
  { n: 9, label: "Lifestyle 1" },
  { n: 10, label: "Lifestyle 2" },
  { n: 11, label: "Trust items" },
  { n: 12, label: "Testimonials" },
  { n: 13, label: "Closing CTA" },
  { n: 14, label: "UGC feed" },
];

function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  const num = title.trim().match(/^(\d+)/)?.[1];
  return (
    <section
      id={num ? `hp-sec-${num}` : undefined}
      className="scroll-mt-28 rounded-lg border border-border-default bg-surface-elevated p-5"
    >
      <h2 className="mb-1 font-headline-md text-headline-md font-semibold text-text-primary">{title}</h2>
      {hint && <p className="mb-4 font-body-sm text-body-sm text-text-secondary">{hint}</p>}
      <div className={hint ? "" : "mt-4"}>{children}</div>
    </section>
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
  const [snapshot, setSnapshot] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch("/api/admin/homepage");
        const data = await res.json();
        if (res.ok) {
          const normalized = normalizeHomepageContent(data.content || {});
          setContent(normalized);
          setSnapshot(JSON.stringify(normalized));
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

  const dirty = content != null && JSON.stringify(content) !== snapshot;

  // Standard unsaved-changes guard.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

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
        const normalized = normalizeHomepageContent(data.content || {});
        setContent(normalized);
        setSnapshot(JSON.stringify(normalized));
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

  if (loading) return <p className="font-body-sm text-body-sm text-text-secondary">Loading homepage content…</p>;
  if (!content)
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 font-body-sm text-body-sm text-red-800">
        {errorMsg || "Could not load homepage content."}
      </p>
    );

  const status = saving ? "Saving…" : dirty ? "Unsaved changes" : savedAt ? "All changes saved" : "";

  return (
    <div className="mx-auto max-w-4xl pb-16">
      {/* Sticky editor toolbar: title, section jump-links, global save + state */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-border-default bg-surface-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-headline-lg text-[22px] font-semibold text-text-primary sm:text-[26px]">
            Homepage editor
          </h1>
          <div className="flex items-center gap-3">
            {status && (
              <span
                className={`font-label-md text-label-md ${
                  dirty && !saving ? "text-amber-700" : "text-text-secondary"
                }`}
              >
                {status}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="shrink-0 rounded-md bg-brand-primary px-4 py-2 font-body-sm text-body-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
        <nav className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {HP_SECTIONS.map((s) => (
            <a
              key={s.n}
              href={`#hp-sec-${s.n}`}
              className="shrink-0 rounded-full border border-border-default bg-surface-elevated px-3 py-1 font-label-md text-label-md text-text-secondary hover:border-brand-primary hover:text-text-primary"
            >
              {s.n}. {s.label}
            </a>
          ))}
        </nav>
      </div>

      {errorMsg && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 font-body-sm text-body-sm text-red-800">
          {errorMsg}
        </p>
      )}
      {savedAt && !errorMsg && !dirty && (
        <p className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 font-body-sm text-body-sm text-green-800">
          Saved.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {/* 1. Hero */}
        <SectionCard
          title="1. Hero banner"
          hint="Full-bleed rotating slides. Auto-advances about every 12 seconds. Upload desktop (16:9) and mobile (4:5) crops per slide."
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
                    aspectLabel="16:9"
                    previewClassName="aspect-[16/9]"
                    outputWidth={1920}
                    outputHeight={1080}
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
                    ["eyebrow", "Eyebrow (optional, small text above headline)"],
                    ["headline", "Headline"],
                    ["subtitle", "Subtitle"],
                    ["button_text", "Button text"],
                    ["button_link", "Button link"],
                    ["button_text_secondary", "Secondary button text (optional)"],
                    ["button_link_secondary", "Secondary button link (optional)"],
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

        {/* 2. Trust strip */}
        <SectionCard
          title="2. Trust strip"
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

        {/* 3. Trending product grid — homepage section under trust strip */}
        <SectionCard
          title="3. Trending Now — product grid"
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

        {/* 4. Editorial story */}
        <SectionCard title="4. Editorial story" hint={'"Designed with love. Made for childhood." section.'}>
          <div className="flex flex-col gap-3">
            <AspectImageUploader
              label="Editorial image"
              value={content.editorial_image_url || ""}
              onChange={(v) => updateField("editorial_image_url", v)}
              aspect={TILE_ASPECT}
              aspectLabel="3:2"
              previewClassName="aspect-[3/2]"
              outputWidth={1536}
              outputHeight={1024}
              variant="desktop"
            />
            <TextField
              label="Eyebrow"
              value={content.editorial_eyebrow || ""}
              onChange={(v) => updateField("editorial_eyebrow", v)}
            />
            <TextField
              label="Headline"
              value={content.editorial_headline || ""}
              onChange={(v) => updateField("editorial_headline", v)}
            />
            <TextField
              label="Body"
              value={content.editorial_body || ""}
              onChange={(v) => updateField("editorial_body", v)}
            />
            <TextField
              label="CTA text"
              value={content.editorial_cta_text || ""}
              onChange={(v) => updateField("editorial_cta_text", v)}
            />
            <TextField
              label="CTA link"
              value={content.editorial_cta_link || ""}
              onChange={(v) => updateField("editorial_cta_link", v)}
              placeholder="/our-story"
            />
          </div>
        </SectionCard>

        {/* 5. Girls */}
        <SectionCard title="5. Girls collection card" hint="First of three collection cards (Girls / Boys / New Arrivals).">
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

        {/* 6. Boys */}
        <SectionCard title="6. Boys collection card" hint="Second of three collection cards (Girls / Boys / New Arrivals).">
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

        {/* 7. New Arrivals collection card */}
        <SectionCard title="7. New Arrivals card" hint="Third collection card, next to Girls/Boys.">
          <div className="flex flex-col gap-3 mb-4">
            <AspectImageUploader
              label="Card image"
              value={content.new_arrivals_image_url || ""}
              onChange={(v) => updateField("new_arrivals_image_url", v)}
              aspect={TILE_ASPECT}
              aspectLabel="3:2"
              previewClassName="aspect-[3/2]"
              outputWidth={1536}
              outputHeight={1024}
              variant="desktop"
            />
            <TextField
              label="Heading"
              value={content.new_arrivals_heading || ""}
              onChange={(v) => updateField("new_arrivals_heading", v)}
            />
            <TextField
              label="Button text"
              value={content.new_arrivals_button_text || ""}
              onChange={(v) => updateField("new_arrivals_button_text", v)}
            />
            <TextField
              label="Fallback link"
              value={content.new_arrivals_link || ""}
              onChange={(v) => updateField("new_arrivals_link", v)}
              placeholder="/products?sort=newest"
            />
          </div>
          <SectionSelector
            label="Card link target"
            mode="link"
            selectionType={content.new_arrivals_selection_type || "category"}
            category={content.new_arrivals_category}
            productIds={content.new_arrivals_product_ids}
            categories={categories}
            products={products}
            onChangeType={(t) => updateField("new_arrivals_selection_type", t)}
            onChangeCategory={(slug) => updateField("new_arrivals_category", slug)}
            onToggleProduct={(id) => toggleProduct("new_arrivals_product_ids", id)}
          />
        </SectionCard>

        {/* 8. Spring Moments seasonal campaign */}
        <SectionCard title="8. Spring Moments campaign banner" hint="Full-width seasonal banner, reuses the meadow_* fields (badge text shown as the eyebrow, e.g. 'Hello Spring').">
          <div className="flex flex-col gap-3 mb-4">
            <AspectImageUploader
              label="Banner image"
              value={content.meadow_image_url || ""}
              onChange={(v) => updateField("meadow_image_url", v)}
              aspect={1.87}
              aspectLabel="~1.87:1"
              previewClassName="aspect-[1.87/1]"
              outputWidth={1920}
              outputHeight={1027}
              variant="desktop"
            />
            <TextField
              label="Eyebrow (e.g. Hello Spring)"
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

        {/* 9. Lifestyle module 1 */}
        <SectionCard title="9. Lifestyle module 1" hint={'"Beautiful pieces for real life" supporting module.'}>
          <div className="flex flex-col gap-3">
            <AspectImageUploader
              label="Module image"
              value={content.lifestyle_1_image_url || ""}
              onChange={(v) => updateField("lifestyle_1_image_url", v)}
              aspect={TILE_ASPECT}
              aspectLabel="3:2"
              previewClassName="aspect-[3/2]"
              outputWidth={1536}
              outputHeight={1024}
              variant="desktop"
            />
            <TextField
              label="Eyebrow"
              value={content.lifestyle_1_eyebrow || ""}
              onChange={(v) => updateField("lifestyle_1_eyebrow", v)}
            />
            <TextField
              label="Headline"
              value={content.lifestyle_1_headline || ""}
              onChange={(v) => updateField("lifestyle_1_headline", v)}
            />
            <TextField
              label="Body"
              value={content.lifestyle_1_body || ""}
              onChange={(v) => updateField("lifestyle_1_body", v)}
            />
            <TextField
              label="CTA text"
              value={content.lifestyle_1_cta_text || ""}
              onChange={(v) => updateField("lifestyle_1_cta_text", v)}
            />
            <TextField
              label="CTA link"
              value={content.lifestyle_1_cta_link || ""}
              onChange={(v) => updateField("lifestyle_1_cta_link", v)}
            />
          </div>
        </SectionCard>

        {/* 10. Lifestyle module 2 */}
        <SectionCard title="10. Lifestyle module 2" hint={'"For the moments that matter" supporting module.'}>
          <div className="flex flex-col gap-3">
            <AspectImageUploader
              label="Module image"
              value={content.lifestyle_2_image_url || ""}
              onChange={(v) => updateField("lifestyle_2_image_url", v)}
              aspect={TILE_ASPECT}
              aspectLabel="3:2"
              previewClassName="aspect-[3/2]"
              outputWidth={1536}
              outputHeight={1024}
              variant="desktop"
            />
            <TextField
              label="Eyebrow"
              value={content.lifestyle_2_eyebrow || ""}
              onChange={(v) => updateField("lifestyle_2_eyebrow", v)}
            />
            <TextField
              label="Headline"
              value={content.lifestyle_2_headline || ""}
              onChange={(v) => updateField("lifestyle_2_headline", v)}
            />
            <TextField
              label="Body"
              value={content.lifestyle_2_body || ""}
              onChange={(v) => updateField("lifestyle_2_body", v)}
            />
            <TextField
              label="CTA text"
              value={content.lifestyle_2_cta_text || ""}
              onChange={(v) => updateField("lifestyle_2_cta_text", v)}
            />
            <TextField
              label="CTA link"
              value={content.lifestyle_2_cta_link || ""}
              onChange={(v) => updateField("lifestyle_2_cta_link", v)}
            />
          </div>
        </SectionCard>

        {/* 11. USP */}
        <SectionCard
          title="11. Why Choose TinyTots"
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

        {/* 12. Testimonials note */}
        <SectionCard title="12. Testimonials">
          <p className="text-sm text-gray-600">
            Managed separately so quotes can be reused. Edit in{" "}
            <Link href="/admin/testimonials" className="text-indigo-600 hover:underline font-medium">
              Testimonials
            </Link>
            .
          </p>
        </SectionCard>

        {/* 13. Closing CTA */}
        <SectionCard title="13. Closing CTA" hint={'"Made to be memories. Beautiful always." final banner before footer.'}>
          <div className="flex flex-col gap-3">
            <AspectImageUploader
              label="Closing banner image"
              value={content.closing_cta_image_url || ""}
              onChange={(v) => updateField("closing_cta_image_url", v)}
              aspect={16 / 9}
              aspectLabel="16:9"
              previewClassName="aspect-[16/9]"
              outputWidth={1920}
              outputHeight={1080}
              variant="desktop"
            />
            <TextField
              label="Headline"
              value={content.closing_cta_headline || ""}
              onChange={(v) => updateField("closing_cta_headline", v)}
            />
            <TextField
              label="Subtext"
              value={content.closing_cta_subtext || ""}
              onChange={(v) => updateField("closing_cta_subtext", v)}
            />
            <TextField
              label="Button text"
              value={content.closing_cta_button_text || ""}
              onChange={(v) => updateField("closing_cta_button_text", v)}
            />
            <TextField
              label="Button link"
              value={content.closing_cta_button_link || ""}
              onChange={(v) => updateField("closing_cta_button_link", v)}
            />
          </div>
        </SectionCard>

        {/* 14. UGC note */}
        <SectionCard title="14. Tag Us / UGC feed">
          <p className="text-sm text-gray-600">
            Shown above the footer on every page. Edit posts in{" "}
            <Link href="/admin/ugc-posts" className="text-indigo-600 hover:underline font-medium">
              UGC Posts
            </Link>
            .
          </p>
        </SectionCard>

        {/* Global — not part of the homepage layout above */}
        <SectionCard
          title="Global Announcement Bar"
          hint="Shown above the header on every storefront page, not just the homepage. Kept here since this is where it has always been edited."
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
      </div>
    </div>
  );
}
