"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/admin-fetch";
import CampaignBannerEditor from "@/components/admin/CampaignBannerEditor";
import CampaignPaletteEditor from "@/components/admin/CampaignPaletteEditor";
import CampaignQrEditor from "@/components/admin/CampaignQrEditor";
import SignageBadgePicker from "@/components/admin/SignageBadgePicker";
import { AdminPageHeader, AdminButton, AdminAlert, AdminSubnav } from "@/components/admin/ui";
import { SUBNAV } from "@/lib/admin-nav";
import {
  DEFAULT_BANNER_CROP,
  DEFAULT_BANNER_FOCAL_POINT,
  DEFAULT_CAMPAIGN_THEME,
  DEFAULT_FEATURE_LIST_POSITION,
  DEFAULT_HERO_BADGE_POSITION,
  type BannerCrop,
  type BannerFocalPoint,
  type CampaignFooterSettings,
  type CampaignSocialLink,
  type CampaignTheme,
  type OverlayPosition,
  type SignageProductBadge,
} from "@/lib/signage-campaign";
import {
  DEFAULT_STORE_TIMEZONE,
  WEEKDAY_OPTIONS,
  describeCampaignSchedule,
  isCampaignScheduleActive,
  normalizeCampaignSchedule,
} from "@/lib/campaign-schedule";

const TIMEZONE_OPTIONS = [
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function timeInputValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */
interface Campaign {
  id: number;
  name: string;
  is_active: boolean;
  collection_label: string;
  heading: string;
  heading_line1_color?: string | null;
  heading_line2_color?: string | null;
  subtitle: string;
  description: string;
  cta_text: string;
  cta_url: string;
  cta_visible: boolean;
  hero_banner_original_url: string | null;
  hero_banner_preview_url: string | null;
  hero_banner_crop: BannerCrop;
  hero_banner_focal_point: BannerFocalPoint;
  hero_badge: string | null;
  hero_badge_position?: OverlayPosition;
  feature_list_position?: OverlayPosition;
  feature_item_ids: number[];
  stat_item_ids: number[];
  featured_heading: string;
  featured_description: string;
  featured_button_text: string;
  featured_selection_type: "products" | "category";
  featured_category: string | null;
  featured_product_ids: number[] | null;
  marquee_speed_seconds: number;
  marquee_direction: "left" | "right";
  display_seconds?: number;
  rotation_order?: number;
  schedule_enabled?: boolean;
  schedule_start_at?: string | null;
  schedule_end_at?: string | null;
  schedule_days?: number[];
  schedule_daily_start?: string | null;
  schedule_daily_end?: string | null;
  schedule_timezone?: string;
  trust_item_ids: number[];
  testimonial_ids: number[];
  social_links: CampaignSocialLink[];
  footer_settings: CampaignFooterSettings | null;
  theme: CampaignTheme;
  updated_at?: string;
  created_at?: string;
}

interface SignageSettings {
  header_logo_text: string;
  header_tagline: string;
  rotation_seconds: number;
  store_timezone: string;
}

function formatEditedAt(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
interface ProductLite {
  id: number;
  name: string;
  image_url: string | null;
  signage_badge?: SignageProductBadge | null;
}
interface CategoryLite {
  name: string;
  slug: string;
}
interface TrustItemOption {
  id: number;
  icon: string;
  heading: string;
  description: string;
  is_active: boolean;
}
interface FeatureItemOption {
  id: number;
  icon: string;
  label: string;
  is_active: boolean;
}
interface StatItemOption {
  id: number;
  icon: string;
  value: string;
  label: string;
  is_active: boolean;
}
interface BadgeItemOption {
  id: number;
  label: string;
  is_active: boolean;
}
interface TestimonialOption {
  id: number;
  customer_name: string;
  customer_image_url: string | null;
  rating: number;
  quote: string;
  is_published: boolean;
}

function toggleMaxThree(current: number[], id: number, selected: boolean): number[] {
  if (selected) return current.filter((itemId) => itemId !== id);
  if (current.length >= 3) return current;
  return [...current, id];
}

function moveId(ids: number[], id: number, delta: number): number[] {
  const index = ids.indexOf(id);
  if (index < 0) return ids;
  const target = index + delta;
  if (target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function defaultTheme(): CampaignTheme {
  return { ...DEFAULT_CAMPAIGN_THEME };
}

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

function PositionSliders({
  label,
  value,
  onChange,
  onReset,
  onInteract,
}: {
  label: string;
  value: OverlayPosition;
  onChange: (next: OverlayPosition) => void;
  onReset: () => void;
  onInteract?: () => void;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <button type="button" onClick={onReset} className="text-xs text-gray-500 underline">
          Reset
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-gray-600">Left ↔ Right ({value.x}%)</span>
          <input
            type="range"
            min={0}
            max={100}
            value={value.x}
            onPointerDown={onInteract}
            onFocus={onInteract}
            onChange={(e) => onChange({ ...value, x: Number(e.target.value) })}
            className="w-full"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-gray-600">Up ↕ Down ({value.y}%)</span>
          <input
            type="range"
            min={0}
            max={100}
            value={value.y}
            onPointerDown={onInteract}
            onFocus={onInteract}
            onChange={(e) => onChange({ ...value, y: Number(e.target.value) })}
            className="w-full"
          />
        </label>
      </div>
    </div>
  );
}

function OverlayPlacementStage({
  bannerUrl,
  theme,
  badgeLabel,
  badgePos,
  featurePos,
  featureLabels,
  large,
}: {
  bannerUrl: string | null;
  theme: CampaignTheme;
  badgeLabel: string | null;
  badgePos: OverlayPosition;
  featurePos: OverlayPosition;
  featureLabels: string[];
  large?: boolean;
}) {
  const badgeSize = large ? "7.5%" : "9%";
  const featureText = large ? "text-[11px]" : "text-[8px]";
  const featureDot = large ? "h-2.5 w-2.5" : "h-2 w-2";
  const badgeText = large ? "text-[11px]" : "text-[8px]";

  return (
    <div
      className="relative w-full overflow-hidden rounded-md border border-gray-200 bg-gray-100"
      style={{ aspectRatio: "16 / 7" }}
    >
      {bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
          Upload a hero banner to preview placement
        </div>
      )}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[35%] opacity-80"
        style={{
          background: `linear-gradient(to right, ${theme.background}, transparent)`,
        }}
      />
      {badgeLabel && (
        <div
          className={`absolute grid place-items-center rounded-full border text-center font-extrabold uppercase leading-none ${badgeText}`}
          style={{
            left: `${badgePos.x}%`,
            top: `${badgePos.y}%`,
            width: badgeSize,
            aspectRatio: "1",
            borderColor: theme.primary,
            color: theme.badgeText,
            background: `linear-gradient(to bottom, color-mix(in srgb, ${theme.primary} 42%, ${theme.badge}), ${theme.badge})`,
          }}
        >
          {badgeLabel.slice(0, 12)}
        </div>
      )}
      {featureLabels.length > 0 && (
        <div
          className="absolute flex flex-col gap-1.5"
          style={{ left: `${featurePos.x}%`, top: `${featurePos.y}%` }}
        >
          {featureLabels.map((label) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 font-bold uppercase tracking-wide ${featureText}`}
              style={{ color: theme.text }}
            >
              <span
                className={`inline-block shrink-0 rounded-full border ${featureDot}`}
                style={{ borderColor: theme.icon, background: theme.surface }}
              />
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HeroOverlayPlacementEditor({
  bannerUrl,
  theme,
  badgeLabel,
  badgePos,
  featurePos,
  featureLabels,
  onChangeBadgePos,
  onChangeFeaturePos,
}: {
  bannerUrl: string | null;
  theme: CampaignTheme;
  badgeLabel: string | null;
  badgePos: OverlayPosition;
  featurePos: OverlayPosition;
  featureLabels: string[];
  onChangeBadgePos: (next: OverlayPosition) => void;
  onChangeFeaturePos: (next: OverlayPosition) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const openPopup = () => setOpen(true);

  return (
    <section className="border border-gray-200 rounded-lg p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Hero overlay placement</h2>
          <p className="text-xs text-gray-500">
            Click the preview or start moving a slider — a larger placement popup opens so you can
            hit the exact spot.
          </p>
        </div>
        <button
          type="button"
          onClick={openPopup}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
        >
          Open placement popup
        </button>
      </div>

      <button
        type="button"
        onClick={openPopup}
        className="group relative block w-full max-w-xl text-left"
      >
        <OverlayPlacementStage
          bannerUrl={bannerUrl}
          theme={theme}
          badgeLabel={badgeLabel}
          badgePos={badgePos}
          featurePos={featurePos}
          featureLabels={featureLabels}
        />
        <span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/25">
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-900 opacity-0 shadow-sm transition group-hover:opacity-100">
            Click to adjust in large preview
          </span>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-5xl flex-col gap-4 overflow-auto rounded-xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Placement preview</h3>
                <p className="text-xs text-gray-500">
                  Move the sliders — overlays update live on this larger stage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Done
              </button>
            </div>

            <OverlayPlacementStage
              bannerUrl={bannerUrl}
              theme={theme}
              badgeLabel={badgeLabel}
              badgePos={badgePos}
              featurePos={featurePos}
              featureLabels={featureLabels}
              large
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {badgeLabel ? (
                <PositionSliders
                  label="Circular badge"
                  value={badgePos}
                  onChange={onChangeBadgePos}
                  onReset={() => onChangeBadgePos({ ...DEFAULT_HERO_BADGE_POSITION })}
                />
              ) : (
                <p className="rounded-md border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500">
                  Pick a circular badge in Campaign Basics to position it here.
                </p>
              )}
              <PositionSliders
                label="Feature list"
                value={featurePos}
                onChange={onChangeFeaturePos}
                onReset={() => onChangeFeaturePos({ ...DEFAULT_FEATURE_LIST_POSITION })}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {badgeLabel ? (
          <PositionSliders
            label="Circular badge"
            value={badgePos}
            onChange={onChangeBadgePos}
            onReset={() => onChangeBadgePos({ ...DEFAULT_HERO_BADGE_POSITION })}
            onInteract={openPopup}
          />
        ) : (
          <p className="rounded-md border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500">
            Pick a circular badge above to position it here.
          </p>
        )}
        <PositionSliders
          label="Feature list"
          value={featurePos}
          onChange={onChangeFeaturePos}
          onReset={() => onChangeFeaturePos({ ...DEFAULT_FEATURE_LIST_POSITION })}
          onInteract={openPopup}
        />
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-md border border-border-default bg-surface-elevated px-3 py-2 font-body-sm text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40";

// Order the campaign editor's jump-nav follows — mirrors the intended
// build workflow. Ids match the `id="camp-sec-*"` on each editor <section>.
const CAMPAIGN_EDITOR_SECTIONS: { id: string; label: string }[] = [
  { id: "basics", label: "Basics" },
  { id: "banner", label: "Banner" },
  { id: "features", label: "Feature icons" },
  { id: "stats", label: "Statistics" },
  { id: "featured", label: "Featured" },
  { id: "trust", label: "Trust strip" },
  { id: "testimonials", label: "Testimonials" },
  { id: "cta", label: "CTA" },
  { id: "theme", label: "Theme" },
  { id: "social", label: "Social" },
  { id: "footer", label: "Footer / QR" },
  { id: "schedule", label: "Scheduling" },
  { id: "preview", label: "Preview" },
];

const SOCIAL_PLATFORMS: CampaignSocialLink["platform"][] = [
  "instagram",
  "facebook",
  "pinterest",
  "tiktok",
];

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
  badgeItems,
  onChangeType,
  onChangeCategory,
  onToggleProduct,
  onProductBadgeChange,
}: {
  selectionType: "products" | "category";
  category: string | null;
  productIds: number[] | null;
  categories: CategoryLite[];
  products: ProductLite[];
  badgeItems: BadgeItemOption[];
  onChangeType: (t: "products" | "category") => void;
  onChangeCategory: (slug: string) => void;
  onToggleProduct: (id: number) => void;
  onProductBadgeChange: (id: number, badge: SignageProductBadge | null) => void;
}) {
  const [search, setSearch] = useState("");
  const [savingBadgeId, setSavingBadgeId] = useState<number | null>(null);
  const selectedIds = new Set(productIds || []);
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  async function saveBadge(productId: number, value: string | null) {
    setSavingBadgeId(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signage_badge: value }),
      });
      if (res.ok) onProductBadgeChange(productId, value);
    } finally {
      setSavingBadgeId(null);
    }
  }

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
                <div
                  key={p.id}
                  className={`flex flex-col gap-1.5 border rounded-md p-2 ${
                    selected ? "border-gray-900 bg-gray-50" : "border-gray-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleProduct(p.id)}
                    className="flex items-center gap-2 text-left hover:opacity-90"
                  >
                    <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 shrink-0 relative">
                      {p.image_url && <Image src={p.image_url} alt="" fill className="object-cover" unoptimized />}
                    </div>
                    <span className="text-xs text-gray-800 line-clamp-2">{p.name}</span>
                  </button>
                  <div onClick={(e) => e.stopPropagation()}>
                    <SignageBadgePicker
                      value={p.signage_badge}
                      options={badgeItems}
                      disabled={savingBadgeId === p.id}
                      onChange={(badge) => void saveBadge(p.id, badge)}
                    />
                  </div>
                </div>
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
  trustItems,
  featureItems,
  statItems,
  badgeItems,
  testimonials,
  onChange,
  onProductBadgeChange,
  onSave,
  saving,
}: {
  campaign: Campaign;
  categories: CategoryLite[];
  products: ProductLite[];
  trustItems: TrustItemOption[];
  featureItems: FeatureItemOption[];
  statItems: StatItemOption[];
  badgeItems: BadgeItemOption[];
  testimonials: TestimonialOption[];
  onChange: (c: Campaign) => void;
  onProductBadgeChange: (id: number, badge: SignageProductBadge | null) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const set = <K extends keyof Campaign>(key: K, value: Campaign[K]) => onChange({ ...campaign, [key]: value });

  const featureIds = campaign.feature_item_ids || [];
  const statIds = campaign.stat_item_ids || [];
  const theme = { ...defaultTheme(), ...(campaign.theme || {}) };
  const socialLinks = SOCIAL_PLATFORMS.map(
    (platform) =>
      (campaign.social_links || []).find((link) => link.platform === platform) || {
        platform,
        account_name: "",
        url: "",
        is_active: false,
      }
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Section jump-nav — the editor is long; this keeps the workflow order
          (basics → banner/layout → featured → trust/stats → theme → footer/QR
          → scheduling → preview) reachable without a long scroll. */}
      <nav className="sticky top-0 z-10 -mx-1 flex gap-1.5 overflow-x-auto rounded-md border border-border-default bg-surface-canvas/95 px-2 py-2 backdrop-blur">
        {CAMPAIGN_EDITOR_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#camp-sec-${s.id}`}
            className="shrink-0 rounded-full border border-border-default bg-surface-elevated px-3 py-1 font-label-md text-label-md text-text-secondary hover:border-brand-primary hover:text-text-primary"
          >
            {s.label}
          </a>
        ))}
      </nav>
      {/* Basics */}
      <section id="camp-sec-basics" className="scroll-mt-24 border border-gray-200 rounded-lg p-5">
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
          <Field label="Heading (line break = 2nd colored line)">
            <textarea
              value={campaign.heading || ""}
              onChange={(e) => set("heading", e.target.value)}
              rows={2}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Heading line 1 color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={campaign.heading_line1_color || theme.text}
                  onChange={(e) => set("heading_line1_color", e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border border-gray-200"
                />
                <button
                  type="button"
                  className="text-xs text-gray-500 underline"
                  onClick={() => set("heading_line1_color", null)}
                >
                  Use theme text
                </button>
              </div>
            </Field>
            <Field label="Heading line 2 color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={campaign.heading_line2_color || theme.primary}
                  onChange={(e) => set("heading_line2_color", e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border border-gray-200"
                />
                <button
                  type="button"
                  className="text-xs text-gray-500 underline"
                  onClick={() => set("heading_line2_color", null)}
                >
                  Use theme primary
                </button>
              </div>
            </Field>
          </div>
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
          <Field label="Display duration on TV (seconds)">
            <input
              type="number"
              min={10}
              max={60}
              value={campaign.display_seconds ?? 18}
              onChange={(e) => set("display_seconds", Math.min(60, Math.max(10, Number(e.target.value) || 18)))}
              className={inputClass}
            />
          </Field>
          <div className="col-span-2">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              Hero circular badge (pool or custom; None hides it)
            </span>
            <SignageBadgePicker
              value={campaign.hero_badge}
              options={badgeItems}
              onChange={(badge) => set("hero_badge", badge)}
              className="rounded-md border border-gray-200 p-3"
            />
          </div>
        </div>
      </section>

      <section id="camp-sec-schedule" className="scroll-mt-24 border border-gray-200 rounded-lg p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Schedule</h2>
          <p className="text-xs text-gray-500">
            Optional calendar and daily hours. Campaign must still be in the rotation queue; the
            schedule only decides when it is eligible to play.
          </p>
        </div>
        {(() => {
          const schedule = normalizeCampaignSchedule(campaign);
          const liveNow = isCampaignScheduleActive(schedule);
          const toggleDay = (day: number) => {
            const current = schedule.schedule_days;
            const next = current.includes(day)
              ? current.filter((value) => value !== day)
              : [...current, day].sort((a, b) => a - b);
            set("schedule_days", next);
          };
          return (
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={schedule.schedule_enabled}
                  onChange={(e) => set("schedule_enabled", e.target.checked)}
                />
                Limit this campaign by date / time
              </label>
              {!schedule.schedule_enabled ? (
                <p className="text-xs text-gray-500">Always eligible while in the live rotation.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="Starts (optional)">
                      <input
                        type="datetime-local"
                        value={toDatetimeLocalValue(schedule.schedule_start_at)}
                        onChange={(e) => set("schedule_start_at", fromDatetimeLocalValue(e.target.value))}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Ends (optional)">
                      <input
                        type="datetime-local"
                        value={toDatetimeLocalValue(schedule.schedule_end_at)}
                        onChange={(e) => set("schedule_end_at", fromDatetimeLocalValue(e.target.value))}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Daily start (optional)">
                      <input
                        type="time"
                        value={timeInputValue(schedule.schedule_daily_start)}
                        onChange={(e) => set("schedule_daily_start", e.target.value || null)}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Daily end (optional)">
                      <input
                        type="time"
                        value={timeInputValue(schedule.schedule_daily_end)}
                        onChange={(e) => set("schedule_daily_end", e.target.value || null)}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Timezone">
                      <select
                        value={schedule.schedule_timezone}
                        onChange={(e) => set("schedule_timezone", e.target.value)}
                        className={inputClass}
                      >
                        {[schedule.schedule_timezone, ...TIMEZONE_OPTIONS]
                          .filter((zone, index, list) => list.indexOf(zone) === index)
                          .map((zone) => (
                            <option key={zone} value={zone}>
                              {zone}
                            </option>
                          ))}
                      </select>
                    </Field>
                  </div>
                  <div>
                    <span className="mb-2 block text-xs font-medium text-gray-600">
                      Days of week (leave all unchecked = every day)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAY_OPTIONS.map((day) => {
                        const checked = schedule.schedule_days.includes(day.value);
                        return (
                          <label
                            key={day.value}
                            className={`cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium ${
                              checked
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() => toggleDay(day.value)}
                            />
                            {day.short}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <p className={`text-xs ${liveNow ? "text-green-700" : "text-amber-700"}`}>
                    {liveNow ? "Eligible right now" : "Outside schedule window right now"} ·{" "}
                    {describeCampaignSchedule(schedule)}
                  </p>
                </>
              )}
            </div>
          );
        })()}
      </section>

      <section id="camp-sec-theme" className="scroll-mt-24 border border-gray-200 rounded-lg p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Campaign Theme</h2>
          <p className="text-xs text-gray-500">
            Pick one theme color — the full palette (buttons, badges, backgrounds, footer) builds
            automatically. Layout stays the same.
          </p>
        </div>
        <CampaignPaletteEditor
          theme={theme}
          onChange={(nextTheme) => set("theme", nextTheme)}
        />
      </section>

      {/* Preview */}
      <section id="camp-sec-preview" className="scroll-mt-24 border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Campaign Preview</h2>
        <p className="text-xs text-gray-500 mb-4">
          Preview this campaign without changing the live signage.
        </p>
        <div className="flex items-center">
          <a
            href={`/signage?preview=${campaign.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            Preview
          </a>
        </div>
      </section>

      {/* CTA */}
      <section id="camp-sec-cta" className="scroll-mt-24 border border-gray-200 rounded-lg p-5">
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

      {/* Hero Banner */}
      <section id="camp-sec-banner" className="scroll-mt-24 border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Hero Banner</h2>
        <p className="text-xs text-gray-500 mb-4">
          Upload visual artwork only: child, product, environment, lighting and background. Collection copy, CTA,
          badge and feature list remain editable HTML overlays. The production crop is fixed at 11:4.
        </p>
        <CampaignBannerEditor
          campaignId={campaign.id}
          originalUrl={campaign.hero_banner_original_url}
          previewUrl={campaign.hero_banner_preview_url}
          savedCrop={campaign.hero_banner_crop || DEFAULT_BANNER_CROP}
          savedFocalPoint={campaign.hero_banner_focal_point || DEFAULT_BANNER_FOCAL_POINT}
          onUpdated={(updated) =>
            onChange({
              ...campaign,
              hero_banner_original_url: updated.hero_banner_original_url
                ? String(updated.hero_banner_original_url)
                : null,
              hero_banner_preview_url: updated.hero_banner_preview_url
                ? String(updated.hero_banner_preview_url)
                : null,
              hero_banner_crop: (updated.hero_banner_crop as BannerCrop) || DEFAULT_BANNER_CROP,
              hero_banner_focal_point:
                (updated.hero_banner_focal_point as BannerFocalPoint) || DEFAULT_BANNER_FOCAL_POINT,
            })
          }
        />
      </section>

      <HeroOverlayPlacementEditor
        bannerUrl={campaign.hero_banner_preview_url || campaign.hero_banner_original_url}
        theme={theme}
        badgeLabel={campaign.hero_badge}
        badgePos={campaign.hero_badge_position || DEFAULT_HERO_BADGE_POSITION}
        featurePos={campaign.feature_list_position || DEFAULT_FEATURE_LIST_POSITION}
        featureLabels={featureIds
          .map((id) => featureItems.find((row) => row.id === id)?.label)
          .filter((label): label is string => !!label)}
        onChangeBadgePos={(next) => set("hero_badge_position", next)}
        onChangeFeaturePos={(next) => set("feature_list_position", next)}
      />

      {/* Feature list */}
      <section id="camp-sec-features" className="scroll-mt-24 border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Hero Feature Icons</h2>
        <p className="text-xs text-gray-500 mb-4">
          Select exactly 3 from the library. Order follows selection below (use arrows to reorder).
          Manage the pool in Signage Libraries. Placement is controlled in Hero overlay placement
          above.
        </p>
        <p className="mb-3 text-xs text-gray-600">{featureIds.length}/3 selected</p>
        <div className="mb-4 flex flex-col gap-2">
          {featureIds.map((id, index) => {
            const item = featureItems.find((row) => row.id === id);
            if (!item) return null;
            return (
              <div key={id} className="flex items-center gap-2 rounded-md border border-gray-900 bg-gray-50 p-2">
                <span className="flex-1 text-sm font-medium text-gray-900">{item.label}</span>
                <button
                  type="button"
                  onClick={() => set("feature_item_ids", moveId(featureIds, id, -1))}
                  disabled={index === 0}
                  className="p-1 disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </button>
                <button
                  type="button"
                  onClick={() => set("feature_item_ids", moveId(featureIds, id, 1))}
                  disabled={index === featureIds.length - 1}
                  className="p-1 disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                </button>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {featureItems.map((item) => {
            const selected = featureIds.includes(item.id);
            const atMax = featureIds.length >= 3 && !selected;
            return (
              <label
                key={item.id}
                className={`flex items-start gap-2 rounded-md border p-3 ${
                  selected ? "border-gray-900 bg-gray-50" : "border-gray-200"
                } ${atMax || !item.is_active ? "opacity-50" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={atMax || !item.is_active}
                  onChange={() => set("feature_item_ids", toggleMaxThree(featureIds, item.id, selected))}
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">{item.label}</span>
                  <span className="block text-xs text-gray-500">{item.icon}</span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Statistics */}
      <section id="camp-sec-stats" className="scroll-mt-24 border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Hero Statistics</h2>
        <p className="text-xs text-gray-500 mb-4">
          Select exactly 3 from the library. Order follows selection below (use arrows to reorder).
        </p>
        <p className="mb-3 text-xs text-gray-600">{statIds.length}/3 selected</p>
        <div className="mb-4 flex flex-col gap-2">
          {statIds.map((id, index) => {
            const item = statItems.find((row) => row.id === id);
            if (!item) return null;
            return (
              <div key={id} className="flex items-center gap-2 rounded-md border border-gray-900 bg-gray-50 p-2">
                <span className="flex-1 text-sm font-medium text-gray-900">
                  {item.value} — {item.label}
                </span>
                <button
                  type="button"
                  onClick={() => set("stat_item_ids", moveId(statIds, id, -1))}
                  disabled={index === 0}
                  className="p-1 disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </button>
                <button
                  type="button"
                  onClick={() => set("stat_item_ids", moveId(statIds, id, 1))}
                  disabled={index === statIds.length - 1}
                  className="p-1 disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                </button>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {statItems.map((item) => {
            const selected = statIds.includes(item.id);
            const atMax = statIds.length >= 3 && !selected;
            return (
              <label
                key={item.id}
                className={`flex items-start gap-2 rounded-md border p-3 ${
                  selected ? "border-gray-900 bg-gray-50" : "border-gray-200"
                } ${atMax || !item.is_active ? "opacity-50" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={atMax || !item.is_active}
                  onChange={() => set("stat_item_ids", toggleMaxThree(statIds, item.id, selected))}
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    {item.value} — {item.label}
                  </span>
                  <span className="block text-xs text-gray-500">{item.icon}</span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Featured Collection */}
      <section id="camp-sec-featured" className="scroll-mt-24 border border-gray-200 rounded-lg p-5">
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
          badgeItems={badgeItems}
          onChangeType={(t) => set("featured_selection_type", t)}
          onChangeCategory={(slug) => set("featured_category", slug)}
          onToggleProduct={(id) => {
            const current = campaign.featured_product_ids || [];
            const next = current.includes(id) ? current.filter((p) => p !== id) : [...current, id];
            set("featured_product_ids", next);
          }}
          onProductBadgeChange={onProductBadgeChange}
        />
      </section>

      <section id="camp-sec-trust" className="scroll-mt-24 border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Campaign Trust Strip</h2>
        <p className="text-xs text-gray-500 mb-4">
          Select the trust points owned by this campaign. Their order follows the list below.
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {trustItems.map((item) => {
            const selected = (campaign.trust_item_ids || []).includes(item.id);
            return (
              <label
                key={item.id}
                className={`flex items-start gap-2 rounded-md border p-3 ${
                  selected ? "border-gray-900 bg-gray-50" : "border-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {
                    const current = campaign.trust_item_ids || [];
                    set(
                      "trust_item_ids",
                      selected ? current.filter((id) => id !== item.id) : [...current, item.id]
                    );
                  }}
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">{item.heading}</span>
                  <span className="block text-xs text-gray-500">{item.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <section id="camp-sec-testimonials" className="scroll-mt-24 border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Campaign Testimonials</h2>
        <p className="text-xs text-gray-500 mb-4">
          Only selected published testimonials are returned when this campaign is active.
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {testimonials.map((testimonial) => {
            const selected = (campaign.testimonial_ids || []).includes(testimonial.id);
            return (
              <label
                key={testimonial.id}
                className={`flex items-start gap-2 rounded-md border p-3 ${
                  selected ? "border-gray-900 bg-gray-50" : "border-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {
                    const current = campaign.testimonial_ids || [];
                    set(
                      "testimonial_ids",
                      selected
                        ? current.filter((id) => id !== testimonial.id)
                        : [...current, testimonial.id]
                    );
                  }}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900">{testimonial.customer_name}</span>
                  <span className="block text-xs text-amber-600">{"★".repeat(testimonial.rating)}</span>
                  <span className="block truncate text-xs text-gray-500">{testimonial.quote}</span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <section id="camp-sec-social" className="scroll-mt-24 border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Campaign Social Links</h2>
        <p className="text-xs text-gray-500 mb-4">
          These links travel with this campaign and replace the old shared signage configuration.
        </p>
        <div className="flex flex-col gap-2">
          {socialLinks.map((link) => (
            <div key={link.platform} className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-2">
              <span className="text-sm font-medium capitalize text-gray-700">{link.platform}</span>
              <input
                value={link.account_name}
                onChange={(event) =>
                  set(
                    "social_links",
                    socialLinks.map((item) =>
                      item.platform === link.platform ? { ...item, account_name: event.target.value } : item
                    )
                  )
                }
                placeholder="@account"
                className={inputClass}
              />
              <input
                value={link.url}
                onChange={(event) =>
                  set(
                    "social_links",
                    socialLinks.map((item) =>
                      item.platform === link.platform ? { ...item, url: event.target.value } : item
                    )
                  )
                }
                placeholder="https://..."
                className={inputClass}
              />
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={link.is_active}
                  onChange={(event) =>
                    set(
                      "social_links",
                      socialLinks.map((item) =>
                        item.platform === link.platform ? { ...item, is_active: event.target.checked } : item
                      )
                    )
                  }
                />
                Visible
              </label>
            </div>
          ))}
        </div>
      </section>

      <section id="camp-sec-footer" className="scroll-mt-24 border border-gray-200 rounded-lg p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Campaign Footer</h2>
            <p className="text-xs text-gray-500">Optional footer and QR configuration owned by this campaign.</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={campaign.footer_settings !== null}
              onChange={(event) =>
                set(
                  "footer_settings",
                  event.target.checked
                    ? {
                        website_url: "www.tinytotsofficial.com",
                        qr_code_image_url: null,
                        qr_visible: true,
                        scan_label: "Scan to Shop",
                      }
                    : null
                )
              }
            />
            Enable footer
          </label>
        </div>
        {campaign.footer_settings && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Website URL">
              <input
                value={campaign.footer_settings.website_url}
                onChange={(event) =>
                  set("footer_settings", { ...campaign.footer_settings!, website_url: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Scan label">
              <input
                value={campaign.footer_settings.scan_label}
                onChange={(event) =>
                  set("footer_settings", { ...campaign.footer_settings!, scan_label: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">QR image</span>
              <CampaignQrEditor
                campaignId={campaign.id}
                imageUrl={campaign.footer_settings.qr_code_image_url}
                onUpdated={(updated) =>
                  onChange({
                    ...campaign,
                    footer_settings: updated.footer_settings as CampaignFooterSettings,
                  })
                }
              />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={campaign.footer_settings.qr_visible}
                onChange={(event) =>
                  set("footer_settings", { ...campaign.footer_settings!, qr_visible: event.target.checked })
                }
              />
              Show QR section
            </label>
          </div>
        )}
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
  const [trustItems, setTrustItems] = useState<TrustItemOption[]>([]);
  const [featureItems, setFeatureItems] = useState<FeatureItemOption[]>([]);
  const [statItems, setStatItems] = useState<StatItemOption[]>([]);
  const [badgeItems, setBadgeItems] = useState<BadgeItemOption[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialOption[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Campaign | null>(null);
  const [signageSettings, setSignageSettings] = useState<SignageSettings>({
    header_logo_text: "TinyTots",
    header_tagline: "Premium Kids Wear",
    rotation_seconds: 18,
    store_timezone: DEFAULT_STORE_TIMEZONE,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function loadAll() {
    try {
      const [res, settingsRes] = await Promise.all([
        adminFetch("/api/admin/campaigns"),
        adminFetch("/api/admin/signage-settings"),
      ]);
      const data = await res.json();
      const settingsData = await settingsRes.json().catch(() => ({}));
      if (res.ok) {
        setCampaigns(data.campaigns || []);
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setTrustItems(data.trust_items || []);
        setFeatureItems(data.feature_items || []);
        setStatItems(data.stat_items || []);
        setBadgeItems(data.badge_items || []);
        setTestimonials(data.testimonials || []);
        if (!selectedId && data.campaigns?.length) {
          setSelectedId(data.campaigns[0].id);
          setDraft(data.campaigns[0]);
        }
      } else {
        setErrorMsg(data.error || "Failed to load campaigns");
      }
      if (settingsRes.ok && settingsData.settings) {
        setSignageSettings(settingsData.settings);
      }
    } catch {
      setErrorMsg("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // The first campaign list is loaded when this client-side admin screen mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    const name = window.prompt("Campaign name?", "New Campaign")?.trim();
    if (!name) return;
    if (name.length > 120) {
      setErrorMsg("Campaign name must be 1–120 characters.");
      return;
    }
    setErrorMsg("");
    try {
      const res = await adminFetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.campaign) {
        // New campaigns always arrive with the default palette from the API.
        await loadAll();
        selectCampaign({
          ...data.campaign,
          theme: normalizeTheme(data.campaign.theme),
        });
        flash("Campaign created with default palette.");
      } else {
        setErrorMsg(data.error || "Failed to create campaign");
      }
    } catch {
      setErrorMsg("Failed to create campaign");
    }
  }

  function normalizeTheme(value: unknown): CampaignTheme {
    return { ...defaultTheme(), ...(value && typeof value === "object" ? (value as CampaignTheme) : {}) };
  }

  async function saveDraft() {
    if (!draft) return;
    const name = (draft.name || "").trim();
    if (!name) {
      setErrorMsg("Campaign name is required.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const payload = {
        ...draft,
        name,
        theme: normalizeTheme(draft.theme),
        feature_item_ids: draft.feature_item_ids || [],
        stat_item_ids: draft.stat_item_ids || [],
        trust_item_ids: draft.trust_item_ids || [],
        testimonial_ids: draft.testimonial_ids || [],
        featured_product_ids: draft.featured_product_ids || [],
      };
      // Never send is_active through save — use Add/Remove from rotation.
      const { is_active: _omitActive, ...safePayload } = payload as Campaign & { is_active?: boolean };

      const res = await adminFetch(`/api/admin/campaigns/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(safePayload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.campaign) {
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

  async function saveSignageSettings() {
    setSavingSettings(true);
    setErrorMsg("");
    try {
      const res = await adminFetch("/api/admin/signage-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signageSettings),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.settings) {
        setSignageSettings(data.settings);
        flash("Signage header & default timing saved.");
      } else {
        setErrorMsg(data.error || "Failed to save signage settings");
      }
    } catch {
      setErrorMsg("Failed to save signage settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function moveInRotation(id: number, delta: number) {
    const queue = campaigns
      .filter((c) => c.is_active)
      .slice()
      .sort((a, b) => (a.rotation_order ?? 0) - (b.rotation_order ?? 0) || a.id - b.id);
    const index = queue.findIndex((c) => c.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= queue.length) return;
    const next = [...queue];
    [next[index], next[target]] = [next[target], next[index]];
    const order = next.map((c) => c.id);
    setCampaigns((prev) =>
      prev.map((c) => {
        const ord = order.indexOf(c.id);
        return ord >= 0 ? { ...c, rotation_order: ord } : c;
      })
    );
    const res = await adminFetch("/api/admin/campaigns/reorder-rotation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    if (!res.ok) {
      setErrorMsg("Failed to reorder rotation queue.");
      await loadAll();
    }
  }

  async function setRotationMembership(id: number, active: boolean) {
    setErrorMsg("");
    try {
      const res = await adminFetch("/api/admin/campaigns/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });
      const text = await res.text();
      let data: { error?: string; warning?: string; campaign?: Campaign } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setErrorMsg(`Failed to update rotation (HTTP ${res.status}). Restart the dev server if this persists.`);
        return;
      }
      if (!res.ok) {
        setErrorMsg(data.error || `Failed to update rotation (HTTP ${res.status})`);
        return;
      }

      const listRes = await adminFetch("/api/admin/campaigns");
      const listData = await listRes.json().catch(() => ({}));
      if (listRes.ok) {
        const nextCampaigns: Campaign[] = listData.campaigns || [];
        setCampaigns(nextCampaigns);
        setDraft((current) => {
          if (!current) return current;
          const refreshed = nextCampaigns.find((campaign) => campaign.id === current.id);
          return refreshed ? { ...current, is_active: refreshed.is_active } : current;
        });
      }
      flash(
        data.warning
          ? data.warning
          : active
            ? "Added to live rotation on /signage."
            : "Removed from live rotation."
      );
    } catch {
      setErrorMsg("Failed to update rotation");
    }
  }

  async function duplicate(id: number) {
    setErrorMsg("");
    try {
      const res = await adminFetch("/api/admin/campaigns/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const text = await res.text();
      let data: { error?: string; campaign?: Campaign } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setErrorMsg(`Failed to duplicate campaign (HTTP ${res.status}). Restart the dev server if this persists.`);
        return;
      }
      if (res.ok && data.campaign) {
        await loadAll();
        selectCampaign(data.campaign);
        flash("Campaign duplicated (inactive). Change its palette, then add to rotation.");
      } else {
        setErrorMsg(data.error || `Failed to duplicate campaign (HTTP ${res.status})`);
      }
    } catch {
      setErrorMsg("Failed to duplicate campaign");
    }
  }

  async function deleteCampaign(id: number) {
    if (!window.confirm("Delete this campaign? This can't be undone.")) return;
    try {
      let res = await adminFetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
      let data = await res.json().catch(() => ({}));
      if (!res.ok && typeof data.error === "string" && data.error.includes("only campaign")) {
        if (!window.confirm("This is the only campaign in the live rotation. Delete it anyway?")) return;
        res = await adminFetch(`/api/admin/campaigns/${id}?force=1`, { method: "DELETE" });
        data = await res.json().catch(() => ({}));
      }
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

  if (loading) return <div className="p-6 font-body-sm text-body-sm text-text-secondary">Loading campaigns…</div>;

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        breadcrumb={["Store experience", "Digital Signage"]}
        title="Campaigns"
        description="Multi-campaign rotation on /signage — queue order, duration, and optional calendar schedules."
        actions={
          <AdminButton variant="primary" onClick={createCampaign}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden>add</span>
            New campaign
          </AdminButton>
        }
      />

      <AdminSubnav items={SUBNAV.signage} />

      {errorMsg && (
        <div className="mb-4">
          <AdminAlert tone="danger">{errorMsg}</AdminAlert>
        </div>
      )}
      {message && (
        <div className="mb-4">
          <AdminAlert tone="success">{message}</AdminAlert>
        </div>
      )}

      <section className="mb-6 rounded-lg border border-gray-200 p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Signage header (global)</h2>
            <p className="text-xs text-gray-500">Shown on every campaign. Default rotation fallback if a campaign has no duration.</p>
          </div>
          <button
            type="button"
            onClick={() => void saveSignageSettings()}
            disabled={savingSettings}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {savingSettings ? "Saving..." : "Save header"}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Logo text</span>
            <input
              value={signageSettings.header_logo_text}
              onChange={(e) => setSignageSettings((s) => ({ ...s, header_logo_text: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Tagline</span>
            <input
              value={signageSettings.header_tagline}
              onChange={(e) => setSignageSettings((s) => ({ ...s, header_tagline: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Default rotation seconds</span>
            <input
              type="number"
              min={10}
              max={60}
              value={signageSettings.rotation_seconds}
              onChange={(e) =>
                setSignageSettings((s) => ({
                  ...s,
                  rotation_seconds: Math.min(60, Math.max(10, Number(e.target.value) || 18)),
                }))
              }
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Store timezone (fallback)</span>
            <select
              value={signageSettings.store_timezone || DEFAULT_STORE_TIMEZONE}
              onChange={(e) => setSignageSettings((s) => ({ ...s, store_timezone: e.target.value }))}
              className={inputClass}
            >
              {[signageSettings.store_timezone, ...TIMEZONE_OPTIONS]
                .filter((zone, index, list) => zone && list.indexOf(zone) === index)
                .map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 p-5">
        <h2 className="mb-1 text-base font-semibold text-gray-900">Live rotation queue</h2>
        <p className="mb-3 text-xs text-gray-500">
          Order controls which campaign plays next among those currently on schedule. Duration is per
          campaign.
        </p>
        <div className="flex flex-col gap-2">
          {campaigns
            .filter((c) => c.is_active)
            .slice()
            .sort((a, b) => (a.rotation_order ?? 0) - (b.rotation_order ?? 0) || a.id - b.id)
            .map((c, index, list) => {
              const schedule = normalizeCampaignSchedule(c, signageSettings.store_timezone);
              const onNow = isCampaignScheduleActive(schedule, new Date(), signageSettings.store_timezone);
              return (
              <div
                key={c.id}
                className={`flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 ${
                  onNow
                    ? "border-green-200 bg-green-50/40"
                    : "border-amber-200 bg-amber-50/50"
                }`}
              >
                <span className="w-6 text-xs font-bold text-gray-500">{index + 1}.</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{c.name}</span>
                <span className="text-xs text-gray-500">{c.display_seconds ?? 18}s</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    !schedule.schedule_enabled
                      ? "bg-gray-100 text-gray-600"
                      : onNow
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                  }`}
                  title={describeCampaignSchedule(schedule)}
                >
                  {!schedule.schedule_enabled ? "Always" : onNow ? "On now" : "Off schedule"}
                </span>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => void moveInRotation(c.id, -1)}
                  className="rounded bg-white px-2 py-1 text-xs disabled:opacity-30"
                >
                  Up
                </button>
                <button
                  type="button"
                  disabled={index === list.length - 1}
                  onClick={() => void moveInRotation(c.id, 1)}
                  className="rounded bg-white px-2 py-1 text-xs disabled:opacity-30"
                >
                  Down
                </button>
              </div>
            );
            })}
          {campaigns.every((c) => !c.is_active) && (
            <p className="text-sm text-gray-500">No campaigns in rotation yet — use Add to rotation below.</p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-[320px_1fr] gap-6">
        {/* Campaign list */}
        <div className="flex flex-col gap-2">
          {campaigns.map((c) => {
            const thumb = c.hero_banner_preview_url || c.hero_banner_original_url;
            return (
              <div
                key={c.id}
                onClick={() => selectCampaign(c)}
                className={`border rounded-lg p-3 cursor-pointer ${
                  selectedId === c.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="mb-2 flex items-start gap-3">
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    {thumb ? (
                      <Image src={thumb} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[10px] text-gray-400">No banner</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900">{c.name}</span>
                      {c.is_active ? (
                        <span className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-700">
                          {c.schedule_enabled
                            ? isCampaignScheduleActive(c, new Date(), signageSettings.store_timezone)
                              ? "Live now"
                              : "Queued"
                            : "Live"}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-500">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      Edited {formatEditedAt(c.updated_at)}
                      {c.is_active ? ` · ${c.display_seconds ?? 18}s` : ""}
                      {c.schedule_enabled ? " · Scheduled" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {c.is_active ? (
                    <button
                      onClick={() => setRotationMembership(c.id, false)}
                      className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-200"
                    >
                      In rotation · Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => setRotationMembership(c.id, true)}
                      className="rounded bg-gray-900 px-2 py-1 text-xs text-white hover:bg-gray-800"
                    >
                      Add to rotation
                    </button>
                  )}
                  <button
                    onClick={() => duplicate(c.id)}
                    className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => deleteCampaign(c.id)}
                    className="rounded bg-gray-100 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {campaigns.length === 0 && <p className="text-sm text-gray-500">No campaigns yet.</p>}
        </div>

        {/* Editor */}
        <div>
          {draft ? (
            <CampaignEditor
              campaign={draft}
              categories={categories}
              products={products}
              trustItems={trustItems}
              featureItems={featureItems}
              statItems={statItems}
              badgeItems={badgeItems}
              testimonials={testimonials}
              onChange={setDraft}
              onProductBadgeChange={(id, badge) => {
                setProducts((prev) =>
                  prev.map((product) => (product.id === id ? { ...product, signage_badge: badge } : product))
                );
              }}
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