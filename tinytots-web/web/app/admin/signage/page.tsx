"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-fetch";

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */
interface SignageContent {
  row1_selection_type: "products" | "category";
  row1_category: string | null;
  row1_product_ids: number[] | null;
  row2_selection_type: "products" | "category";
  row2_category: string | null;
  row2_product_ids: number[] | null;
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

interface Banner {
  id?: number;
  image_url: string;
  heading: string;
  subtext: string;
  link: string;
  display_seconds: number;
  is_active: boolean;
}

type BlockKey = "meadow" | "boys" | "girls" | "collections" | "accessories";
const BLOCKS: { key: BlockKey; label: string }[] = [
  { key: "meadow", label: "Meadow (large)" },
  { key: "boys", label: "Boys (medium)" },
  { key: "girls", label: "Girls (medium)" },
  { key: "collections", label: "Collections (large)" },
  { key: "accessories", label: "Accessories (medium)" },
];

const emptyBanner = (): Banner => ({
  image_url: "",
  heading: "",
  subtext: "",
  link: "/products",
  display_seconds: 7,
  is_active: true,
});

/* ------------------------------------------------------------------
 * Row selector — reused for marquee row 1 and row 2 (same pattern as the
 * homepage editor's category/products picker).
 * ------------------------------------------------------------------ */
function RowSelector({
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
      <h2 className="text-base font-semibold text-gray-900 mb-1">{label}</h2>
      <p className="text-xs text-gray-500 mb-3">Products shown scrolling across this marquee row.</p>
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

/* ------------------------------------------------------------------
 * Trust/Comfort revolving word list editor
 * ------------------------------------------------------------------ */
function WordsEditor({
  words,
  onChange,
  onSave,
  saving,
}: {
  words: string[];
  onChange: (words: string[]) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Trust • Care • Quality • Comfort line</h2>
      <p className="text-xs text-gray-500 mb-4">
        The words that revolve in the divider marquee, in order. Add, remove, or reorder as you like.
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {words.map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={w}
              onChange={(e) => {
                const next = [...words];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              type="button"
              onClick={() => onChange(words.filter((_, idx) => idx !== i))}
              disabled={words.length <= 1}
              className="text-gray-400 hover:text-red-600 disabled:opacity-30 p-1"
              title="Remove"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (i === 0) return;
                const next = [...words];
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                onChange(next);
              }}
              disabled={i === 0}
              className="text-gray-400 hover:text-gray-900 disabled:opacity-30 p-1"
              title="Move up"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (i === words.length - 1) return;
                const next = [...words];
                [next[i + 1], next[i]] = [next[i], next[i + 1]];
                onChange(next);
              }}
              disabled={i === words.length - 1}
              className="text-gray-400 hover:text-gray-900 disabled:opacity-30 p-1"
              title="Move down"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange([...words, ""])}
          className="text-sm font-medium px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          + Add word
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="text-sm font-medium px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60 ml-auto"
        >
          {saving ? "Saving..." : "Save word list"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * One bento block's banner editor — up to 5 banners, each fully custom.
 * ------------------------------------------------------------------ */
function BentoBlockEditor({
  banners,
  onChange,
  onSave,
  saving,
}: {
  banners: Banner[];
  onChange: (banners: Banner[]) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-gray-900">Banners</h2>
        <span className="text-xs text-gray-500">{banners.length} / 5</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Each banner crossfades in for its own display time (5-10s), then the next one takes over. Position on screen never
        moves — only the image and text change.
      </p>

      <div className="flex flex-col gap-4">
        {banners.map((b, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 shrink-0 relative">
                {b.image_url && <Image src={b.image_url} alt="" fill className="object-cover" unoptimized />}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <input
                  value={b.image_url}
                  onChange={(e) => {
                    const next = [...banners];
                    next[i] = { ...b, image_url: e.target.value };
                    onChange(next);
                  }}
                  placeholder="Image URL"
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <div className="flex gap-2">
                  <input
                    value={b.heading}
                    onChange={(e) => {
                      const next = [...banners];
                      next[i] = { ...b, heading: e.target.value };
                      onChange(next);
                    }}
                    placeholder="Heading (e.g. New Arrivals)"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <input
                    value={b.subtext}
                    onChange={(e) => {
                      const next = [...banners];
                      next[i] = { ...b, subtext: e.target.value };
                      onChange(next);
                    }}
                    placeholder="Subtext (optional)"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    value={b.link}
                    onChange={(e) => {
                      const next = [...banners];
                      next[i] = { ...b, link: e.target.value };
                      onChange(next);
                    }}
                    placeholder="Link (e.g. /products?category=boys)"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0">
                    Show for
                    <input
                      type="number"
                      min={5}
                      max={10}
                      value={b.display_seconds}
                      onChange={(e) => {
                        const next = [...banners];
                        next[i] = { ...b, display_seconds: Math.min(10, Math.max(5, Number(e.target.value) || 7)) };
                        onChange(next);
                      }}
                      className="w-14 border border-gray-300 rounded-md px-2 py-1 text-sm text-center"
                    />
                    sec
                  </label>
                  <button
                    type="button"
                    onClick={() => onChange(banners.filter((_, idx) => idx !== i))}
                    className="text-gray-400 hover:text-red-600 p-1 shrink-0"
                    title="Remove banner"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && <p className="text-sm text-gray-500">No banners yet — add up to 5 below.</p>}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={() => onChange([...banners, emptyBanner()])}
          disabled={banners.length >= 5}
          className="text-sm font-medium px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40"
        >
          + Add banner
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="text-sm font-medium px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60 ml-auto"
        >
          {saving ? "Saving..." : "Save this block"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------ */
export default function AdminSignagePage() {
  const [content, setContent] = useState<SignageContent | null>(null);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [bento, setBento] = useState<Record<BlockKey, Banner[]>>({
    meadow: [],
    boys: [],
    girls: [],
    collections: [],
    accessories: [],
  });
  const [activeBlock, setActiveBlock] = useState<BlockKey>("meadow");

  const [loading, setLoading] = useState(true);
  const [savingRows, setSavingRows] = useState(false);
  const [savingWords, setSavingWords] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [contentRes, wordsRes, bentoRes] = await Promise.all([
          adminFetch("/api/admin/signage"),
          adminFetch("/api/admin/signage/words"),
          adminFetch("/api/admin/signage/bento"),
        ]);
        const contentData = await contentRes.json();
        const wordsData = await wordsRes.json();
        const bentoData = await bentoRes.json();

        if (contentRes.ok) {
          setContent(contentData.content);
          setProducts(contentData.products || []);
          setCategories(contentData.categories || []);
        }
        if (wordsRes.ok) {
          setWords((wordsData.words || []).map((w: any) => w.word));
        }
        if (bentoRes.ok) {
          const grouped = bentoData.bento || {};
          setBento({
            meadow: grouped.meadow || [],
            boys: grouped.boys || [],
            girls: grouped.girls || [],
            collections: grouped.collections || [],
            accessories: grouped.accessories || [],
          });
        }
        if (!contentRes.ok || !wordsRes.ok || !bentoRes.ok) {
          setErrorMsg("Some signage content failed to load.");
        }
      } catch {
        setErrorMsg("Failed to load signage content.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  }

  function toggleProduct(field: "row1_product_ids" | "row2_product_ids", id: number) {
    setContent((prev) => {
      if (!prev) return prev;
      const current = prev[field] || [];
      const next = current.includes(id) ? current.filter((p) => p !== id) : [...current, id];
      return { ...prev, [field]: next };
    });
  }

  async function saveRows() {
    if (!content) return;
    setSavingRows(true);
    setErrorMsg("");
    try {
      const res = await adminFetch("/api/admin/signage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = await res.json();
      if (res.ok) {
        setContent(data.content);
        flash("Marquee rows saved.");
      } else {
        setErrorMsg(data.error || "Failed to save marquee rows");
      }
    } catch {
      setErrorMsg("Failed to save marquee rows");
    } finally {
      setSavingRows(false);
    }
  }

  async function saveWords() {
    setSavingWords(true);
    setErrorMsg("");
    try {
      const res = await adminFetch("/api/admin/signage/words", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words }),
      });
      const data = await res.json();
      if (res.ok) {
        setWords((data.words || []).map((w: any) => w.word));
        flash("Word list saved.");
      } else {
        setErrorMsg(data.error || "Failed to save word list");
      }
    } catch {
      setErrorMsg("Failed to save word list");
    } finally {
      setSavingWords(false);
    }
  }

  async function saveBlock(block: BlockKey) {
    setSavingBlock(true);
    setErrorMsg("");
    try {
      const res = await adminFetch("/api/admin/signage/bento", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ block_key: block, banners: bento[block] }),
      });
      const data = await res.json();
      if (res.ok) {
        setBento((prev) => ({ ...prev, [block]: data.banners || [] }));
        flash(`${block.charAt(0).toUpperCase() + block.slice(1)} block saved.`);
      } else {
        setErrorMsg(data.error || "Failed to save banners");
      }
    } catch {
      setErrorMsg("Failed to save banners");
    } finally {
      setSavingBlock(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading signage content...</div>;
  if (!content) return <div className="p-6 text-sm text-red-600">{errorMsg || "Could not load signage content."}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">In-Store TV Signage</h1>
        <p className="text-sm text-gray-500">
          Controls what plays on <code>/signage</code> — the fullscreen display for the shop TV. Testimonials are managed
          separately under Testimonials.
        </p>
      </div>

      {errorMsg && <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md mb-4">{errorMsg}</p>}
      {message && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md mb-4">{message}</p>}

      <div className="flex flex-col gap-8">
        {/* Marquee rows */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Product Marquee Rows</h2>
          <div className="flex flex-col gap-4">
            <RowSelector
              label="Row 1 (scrolls right → left)"
              selectionType={content.row1_selection_type || "category"}
              category={content.row1_category}
              productIds={content.row1_product_ids}
              categories={categories}
              products={products}
              onChangeType={(t) => setContent({ ...content, row1_selection_type: t })}
              onChangeCategory={(slug) => setContent({ ...content, row1_category: slug })}
              onToggleProduct={(id) => toggleProduct("row1_product_ids", id)}
            />
            <RowSelector
              label="Row 2 (scrolls left → right)"
              selectionType={content.row2_selection_type || "category"}
              category={content.row2_category}
              productIds={content.row2_product_ids}
              categories={categories}
              products={products}
              onChangeType={(t) => setContent({ ...content, row2_selection_type: t })}
              onChangeCategory={(slug) => setContent({ ...content, row2_category: slug })}
              onToggleProduct={(id) => toggleProduct("row2_product_ids", id)}
            />
            <button
              type="button"
              onClick={saveRows}
              disabled={savingRows}
              className="self-end text-sm font-medium px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {savingRows ? "Saving..." : "Save marquee rows"}
            </button>
          </div>
        </div>

        {/* Trust words */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Divider Marquee</h2>
          <WordsEditor words={words} onChange={setWords} onSave={saveWords} saving={savingWords} />
        </div>

        {/* Bento banners */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Bento Grid Banners</h2>
          <div className="flex gap-2 mb-4 flex-wrap">
            {BLOCKS.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => setActiveBlock(b.key)}
                className={`text-sm font-medium px-3 py-1.5 rounded-md ${
                  activeBlock === b.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {b.label} ({bento[b.key].length})
              </button>
            ))}
          </div>
          <BentoBlockEditor
            banners={bento[activeBlock]}
            onChange={(next) => setBento((prev) => ({ ...prev, [activeBlock]: next }))}
            onSave={() => saveBlock(activeBlock)}
            saving={savingBlock}
          />
        </div>
      </div>
    </div>
  );
}