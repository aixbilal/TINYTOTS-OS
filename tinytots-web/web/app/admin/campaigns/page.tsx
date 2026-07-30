"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-fetch";

/* ------------------------------------------------------------------
 * Suggested content — click-to-insert presets so the admin doesn't have
 * to write copy from scratch. These are NOT stored anywhere; they just
 * prefill a new row in the editor.
 * ------------------------------------------------------------------ */
const STAT_SUGGESTIONS = [
  { icon: "local_shipping", number: "25,000+", description: "Orders Delivered" },
  { icon: "sentiment_satisfied", number: "98%", description: "Parent Satisfaction" },
  { icon: "new_releases", number: "500+", description: "New Arrivals" },
  { icon: "eco", number: "Certified", description: "Organic Cotton" },
  { icon: "design_services", number: "Premium", description: "Stitching" },
  { icon: "spa", number: "Skin-Friendly", description: "Fabric" },
  { icon: "verified", number: "Since 2020", description: "Trusted Brand" },
  { icon: "local_shipping", number: "Free", description: "Nationwide Delivery" },
];

const ICON_OPTIONS = [
  "eco", "spa", "verified_user", "group", "checkroom", "shield_check", "local_shipping", "sync_alt",
  "verified", "lock", "air", "favorite", "handshake", "construction", "bolt", "new_releases",
  "sentiment_satisfied", "design_services",
];

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */
interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}
interface StatItem {
  icon: string;
  number: string;
  description: string;
}
interface Campaign {
  id: number;
  name: string;
  is_active: boolean;
  collection_label: string;
  heading: string;
  subtitle: string;
  description: string;
  cta_text: string;
  cta_url: string;
  cta_visible: boolean;
  hero_mode: "single_image" | "separate_assets";
  hero_banner_image: string | null;
  hero_product_image: string | null;
  hero_badge: string | null;
  lifestyle_image: string | null;
  feature_list: FeatureItem[];
  statistics: StatItem[];
  featured_heading: string;
  featured_description: string;
  featured_button_text: string;
  featured_selection_type: "products" | "category";
  featured_category: string | null;
  featured_product_ids: number[] | null;
  marquee_speed_seconds: number;
  marquee_direction: "left" | "right";
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

const blankCampaign = (name: string): Partial<Campaign> => ({ name });

/* ------------------------------------------------------------------
 * Small reusable field components
 * ------------------------------------------------------------------ */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}
const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900";

/* ------------------------------------------------------------------
 * Featured product/category picker — same pattern as the homepage and
 * signage marquee editors.
 * ------------------------------------------------------------------ */
function FeaturedSelector({
  selectionType,
  category,
  productIds,
  categories,
  products,
  onChangeType,
  onChangeCategory,
  onToggleProduct,
}: {
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
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex gap-2 mb-3">
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
        <select value={category || ""} onChange={(e) => onChangeCategory(e.target.value)} className={inputClass}>
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
            className={`${inputClass} mb-2`}
          />
          <p className="text-xs text-gray-500 mb-2">{selectedIds.size} selected</p>
          <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
            {filtered.map((p) => {
              const selected = selectedIds.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggleProduct(p.id)}
                  className={`flex items-center gap-2 border rounded-md p-2 text-left ${
                    selected ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 shrink-0 relative">
                    {p.image_url && <Image src={p.image_url} alt="" fill className="object-cover" unoptimized />}
                  </div>
                  <span className="text-xs text-gray-800 line-clamp-2">{p.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
 * Editor — every field for the currently-selected campaign
 * ------------------------------------------------------------------ */
function CampaignEditor({
  campaign,
  categories,
  products,
  onChange,
  onSave,
  saving,
}: {
  campaign: Campaign;
  categories: CategoryLite[];
  products: ProductLite[];
  onChange: (c: Campaign) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const set = <K extends keyof Campaign>(key: K, value: Campaign[K]) => onChange({ ...campaign, [key]: value });

  const features = campaign.feature_list || [];
  const stats = campaign.statistics || [];

  return (
    <div className="flex flex-col gap-8">
      {/* Basics */}
      <section className="border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Campaign Basics</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Campaign name (internal)">
            <input value={campaign.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Collection label (e.g. AUTUMN 2026)">
            <input
              value={campaign.collection_label || ""}
              onChange={(e) => set("collection_label", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Heading (use a line break for the 2nd rust-colored line)">
            <textarea
              value={campaign.heading || ""}
              onChange={(e) => set("heading", e.target.value)}
              rows={2}
              className={inputClass}
            />
          </Field>
          <Field label="Subtitle">
            <input value={campaign.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Description">
            <textarea
              value={campaign.description || ""}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className={inputClass}
            />
          </Field>
          <Field label="Hero badge (e.g. BEST SELLER, NEW, LIMITED)">
            <input value={campaign.hero_badge || ""} onChange={(e) => set("hero_badge", e.target.value)} className={inputClass} />
          </Field>
        </div>
      </section>

      {/* CTA */}
      <section className="border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">CTA Button</h2>
        <div className="grid grid-cols-3 gap-4 items-end">
          <Field label="Button text">
            <input value={campaign.cta_text || ""} onChange={(e) => set("cta_text", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Button URL">
            <input value={campaign.cta_url || ""} onChange={(e) => set("cta_url", e.target.value)} className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
            <input type="checkbox" checked={campaign.cta_visible} onChange={(e) => set("cta_visible", e.target.checked)} />
            Visible
          </label>
        </div>
      </section>

      {/* Hero Banner mode */}
      <section className="border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Hero Banner</h2>
        <p className="text-xs text-gray-500 mb-4">
          Recommended: upload one complete banner image (kid + product + background already composed). You can switch
          to separate assets later without losing either set of images.
        </p>
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => set("hero_mode", "single_image")}
            className={`text-sm font-medium px-3 py-1.5 rounded-md ${
              campaign.hero_mode === "single_image" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Single Banner Image (recommended)
          </button>
          <button
            type="button"
            onClick={() => set("hero_mode", "separate_assets")}
            className={`text-sm font-medium px-3 py-1.5 rounded-md ${
              campaign.hero_mode === "separate_assets" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Separate Assets
          </button>
        </div>

        {campaign.hero_mode === "single_image" ? (
          <Field label="Hero banner image URL">
            <input
              value={campaign.hero_banner_image || ""}
              onChange={(e) => set("hero_banner_image", e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Hero product image URL">
              <input
                value={campaign.hero_product_image || ""}
                onChange={(e) => set("hero_product_image", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Lifestyle image URL">
              <input
                value={campaign.lifestyle_image || ""}
                onChange={(e) => set("lifestyle_image", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        )}
      </section>

      {/* Feature list */}
      <section className="border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Hero Feature List (icon + title, unlimited)</h2>
        <div className="flex flex-col gap-2 mb-3">
          {features.map((f, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                value={f.icon}
                onChange={(e) => {
                  const next = [...features];
                  next[i] = { ...f, icon: e.target.value };
                  set("feature_list", next);
                }}
                className={`${inputClass} w-40`}
              >
                {ICON_OPTIONS.map((ic) => (
                  <option key={ic} value={ic}>
                    {ic}
                  </option>
                ))}
              </select>
              <input
                value={f.title}
                onChange={(e) => {
                  const next = [...features];
                  next[i] = { ...f, title: e.target.value };
                  set("feature_list", next);
                }}
                placeholder="Title"
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => set("feature_list", features.filter((_, idx) => idx !== i))}
                className="text-gray-400 hover:text-red-600 p-1"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => set("feature_list", [...features, { icon: "eco", title: "", description: "" }])}
          className="text-sm font-medium px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          + Add feature
        </button>
      </section>

      {/* Statistics */}
      <section className="border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Statistics</h2>
        <p className="text-xs text-gray-500 mb-3">Add, remove, reorder, or edit any statistic.</p>

        <div className="flex flex-col gap-2 mb-3">
          {stats.map((s, i) => (
            <div key={i} className="flex gap-2 items-center border border-gray-200 rounded-md p-2">
              <select
                value={s.icon}
                onChange={(e) => {
                  const next = [...stats];
                  next[i] = { ...s, icon: e.target.value };
                  set("statistics", next);
                }}
                className={`${inputClass} w-36`}
              >
                {ICON_OPTIONS.map((ic) => (
                  <option key={ic} value={ic}>
                    {ic}
                  </option>
                ))}
              </select>
              <input
                value={s.number}
                onChange={(e) => {
                  const next = [...stats];
                  next[i] = { ...s, number: e.target.value };
                  set("statistics", next);
                }}
                placeholder="50,000+"
                className={`${inputClass} w-32`}
              />
              <input
                value={s.description}
                onChange={(e) => {
                  const next = [...stats];
                  next[i] = { ...s, description: e.target.value };
                  set("statistics", next);
                }}
                placeholder="Happy Parents"
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => {
                  if (i === 0) return;
                  const next = [...stats];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  set("statistics", next);
                }}
                disabled={i === 0}
                className="text-gray-400 hover:text-gray-900 disabled:opacity-30 p-1"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              </button>
              <button
                type="button"
                onClick={() => set("statistics", stats.filter((_, idx) => idx !== i))}
                className="text-gray-400 hover:text-red-600 p-1"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => set("statistics", [...stats, { icon: "verified", number: "", description: "" }])}
          className="text-sm font-medium px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 mb-3"
        >
          + Add blank statistic
        </button>

        <p className="text-xs text-gray-500 mb-2">Or click a suggestion to add it instantly:</p>
        <div className="flex flex-wrap gap-2">
          {STAT_SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => set("statistics", [...stats, { ...sug }])}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              {sug.number} — {sug.description}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Collection */}
      <section className="border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Featured Collection</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Section heading">
            <input
              value={campaign.featured_heading || ""}
              onChange={(e) => set("featured_heading", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Explore button text">
            <input
              value={campaign.featured_button_text || ""}
              onChange={(e) => set("featured_button_text", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Description">
            <input
              value={campaign.featured_description || ""}
              onChange={(e) => set("featured_description", e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Marquee speed (seconds per loop)">
              <input
                type="number"
                min={15}
                max={90}
                value={campaign.marquee_speed_seconds || 45}
                onChange={(e) => set("marquee_speed_seconds", Number(e.target.value) || 45)}
                className={inputClass}
              />
            </Field>
            <Field label="Direction">
              <select
                value={campaign.marquee_direction || "left"}
                onChange={(e) => set("marquee_direction", e.target.value as "left" | "right")}
                className={inputClass}
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </Field>
          </div>
        </div>

        <FeaturedSelector
          selectionType={campaign.featured_selection_type || "products"}
          category={campaign.featured_category}
          productIds={campaign.featured_product_ids}
          categories={categories}
          products={products}
          onChangeType={(t) => set("featured_selection_type", t)}
          onChangeCategory={(slug) => set("featured_category", slug)}
          onToggleProduct={(id) => {
            const current = campaign.featured_product_ids || [];
            const next = current.includes(id) ? current.filter((p) => p !== id) : [...current, id];
            set("featured_product_ids", next);
          }}
        />
      </section>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="self-end text-sm font-medium px-5 py-2.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Campaign"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------ */
export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Campaign | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function loadAll() {
    try {
      const res = await adminFetch("/api/admin/campaigns");
      const data = await res.json();
      if (res.ok) {
        setCampaigns(data.campaigns || []);
        setProducts(data.products || []);
        setCategories(data.categories || []);
        if (!selectedId && data.campaigns?.length) {
          setSelectedId(data.campaigns[0].id);
          setDraft(data.campaigns[0]);
        }
      } else {
        setErrorMsg(data.error || "Failed to load campaigns");
      }
    } catch {
      setErrorMsg("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  }

  function selectCampaign(c: Campaign) {
    setSelectedId(c.id);
    setDraft(c);
  }

  async function createCampaign() {
    const name = window.prompt("Campaign name?", "New Campaign");
    if (!name) return;
    try {
      const res = await adminFetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blankCampaign(name)),
      });
      const data = await res.json();
      if (res.ok) {
        await loadAll();
        selectCampaign(data.campaign);
        flash("Campaign created.");
      } else {
        setErrorMsg(data.error || "Failed to create campaign");
      }
    } catch {
      setErrorMsg("Failed to create campaign");
    }
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await adminFetch(`/api/admin/campaigns/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (res.ok) {
        setDraft(data.campaign);
        setCampaigns((prev) => prev.map((c) => (c.id === data.campaign.id ? data.campaign : c)));
        flash("Campaign saved.");
      } else {
        setErrorMsg(data.error || "Failed to save campaign");
      }
    } catch {
      setErrorMsg("Failed to save campaign");
    } finally {
      setSaving(false);
    }
  }

  async function activate(id: number) {
    try {
      const res = await adminFetch(`/api/admin/campaigns/${id}/activate`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        await loadAll();
        flash("Campaign activated — live on /signage now.");
      } else {
        setErrorMsg(data.error || "Failed to activate campaign");
      }
    } catch {
      setErrorMsg("Failed to activate campaign");
    }
  }

  async function deactivate(id: number) {
    try {
      const res = await adminFetch(`/api/admin/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });
      if (res.ok) {
        await loadAll();
        flash("Campaign deactivated.");
      }
    } catch {
      setErrorMsg("Failed to deactivate campaign");
    }
  }

  async function duplicate(id: number) {
    try {
      const res = await adminFetch(`/api/admin/campaigns/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        await loadAll();
        selectCampaign(data.campaign);
        flash("Campaign duplicated.");
      } else {
        setErrorMsg(data.error || "Failed to duplicate campaign");
      }
    } catch {
      setErrorMsg("Failed to duplicate campaign");
    }
  }

  async function deleteCampaign(id: number) {
    if (!window.confirm("Delete this campaign? This can't be undone.")) return;
    try {
      const res = await adminFetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        if (selectedId === id) {
          setSelectedId(null);
          setDraft(null);
        }
        await loadAll();
        flash("Campaign deleted.");
      } else {
        setErrorMsg(data.error || "Failed to delete campaign");
      }
    } catch {
      setErrorMsg("Failed to delete campaign");
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading campaigns...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
          <p className="text-sm text-gray-500">Only one campaign is live on /signage at a time.</p>
        </div>
        <button
          onClick={createCampaign}
          className="text-sm font-medium px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800"
        >
          + New Campaign
        </button>
      </div>

      {errorMsg && <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md mb-4">{errorMsg}</p>}
      {message && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md mb-4">{message}</p>}

      <div className="grid grid-cols-[280px_1fr] gap-6">
        {/* Campaign list */}
        <div className="flex flex-col gap-2">
          {campaigns.map((c) => (
            <div
              key={c.id}
              onClick={() => selectCampaign(c)}
              className={`border rounded-lg p-3 cursor-pointer ${
                selectedId === c.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900 truncate">{c.name}</span>
                {c.is_active && (
                  <span className="text-[10px] font-bold uppercase bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    Live
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                {!c.is_active ? (
                  <button onClick={() => activate(c.id)} className="text-xs px-2 py-1 rounded bg-gray-900 text-white hover:bg-gray-800">
                    Activate
                  </button>
                ) : (
                  <button onClick={() => deactivate(c.id)} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">
                    Deactivate
                  </button>
                )}
                <button onClick={() => duplicate(c.id)} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">
                  Duplicate
                </button>
                <button
                  onClick={() => deleteCampaign(c.id)}
                  disabled={c.is_active}
                  className="text-xs px-2 py-1 rounded bg-gray-100 text-red-600 hover:bg-red-50 disabled:opacity-30"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && <p className="text-sm text-gray-500">No campaigns yet.</p>}
        </div>

        {/* Editor */}
        <div>
          {draft ? (
            <CampaignEditor
              campaign={draft}
              categories={categories}
              products={products}
              onChange={setDraft}
              onSave={saveDraft}
              saving={saving}
            />
          ) : (
            <p className="text-sm text-gray-500">Select a campaign on the left, or create a new one.</p>
          )}
        </div>
      </div>
    </div>
  );
}