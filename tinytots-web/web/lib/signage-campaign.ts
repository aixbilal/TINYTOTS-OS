export type CampaignTheme = {
  primary: string;
  secondary: string;
  accent: string;
  button: string;
  buttonText: string;
  badge: string;
  badgeText: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  mutedText: string;
  border: string;
  icon: string;
  footer: string;
  footerText: string;
};

export type BannerCrop = {
  unit: "%";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type BannerFocalPoint = {
  x: number;
  y: number;
};

export type CampaignSocialLink = {
  platform: "instagram" | "facebook" | "pinterest" | "tiktok";
  account_name: string;
  url: string;
  is_active: boolean;
};

export type CampaignFooterSettings = {
  website_url: string;
  qr_code_image_url: string | null;
  qr_visible: boolean;
  scan_label: string;
};

/** Free-text product card badge for the signage featured marquee (null = none). */
export type SignageProductBadge = string;

/** Legacy enum tokens kept for migration display / seed defaults. */
export const SIGNAGE_PRODUCT_BADGES = [
  "NEW",
  "BEST SELLER",
  "LIMITED EDITION",
] as const;

const MAX_SIGNAGE_BADGE_LENGTH = 40;

/** Normalize free-text badge; accepts legacy BEST_SELLER / LIMITED_EDITION tokens. */
export function normalizeSignageProductBadge(value: unknown): SignageProductBadge | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const legacy =
    trimmed === "BEST_SELLER"
      ? "BEST SELLER"
      : trimmed === "LIMITED_EDITION"
        ? "LIMITED EDITION"
        : trimmed;
  return legacy.slice(0, MAX_SIGNAGE_BADGE_LENGTH);
}

export function formatSignageProductBadgeLabel(badge: SignageProductBadge): string {
  return badge;
}

/** Visual variant for the existing three pill styles; everything else uses primary. */
export function signageProductBadgeVariant(
  badge: SignageProductBadge
): "new" | "best_seller" | "limited" | "default" {
  const key = badge.toUpperCase().replace(/_/g, " ").trim();
  if (key === "NEW") return "new";
  if (key === "BEST SELLER") return "best_seller";
  if (key === "LIMITED EDITION") return "limited";
  return "default";
}

export const DEFAULT_CAMPAIGN_THEME: CampaignTheme = {
  primary: "#9c422e",
  secondary: "#3b241a",
  accent: "#c77b64",
  button: "#9c422e",
  buttonText: "#ffffff",
  badge: "#fffaf5",
  badgeText: "#9c422e",
  background: "#faf5f0",
  surface: "#fffaf7",
  card: "#ffffff",
  text: "#221f1d",
  mutedText: "#6d625c",
  border: "#ded3cc",
  icon: "#9c422e",
  footer: "#3b241a",
  footerText: "#ffffff",
};

export const DEFAULT_BANNER_CROP: BannerCrop = {
  unit: "%",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

export const DEFAULT_BANNER_FOCAL_POINT: BannerFocalPoint = {
  x: 50,
  y: 50,
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function normalizeCampaignTheme(value: unknown): CampaignTheme {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return Object.fromEntries(
    Object.entries(DEFAULT_CAMPAIGN_THEME).map(([key, fallback]) => {
      const candidate = source[key];
      return [key, typeof candidate === "string" && HEX_COLOR.test(candidate) ? candidate : fallback];
    })
  ) as CampaignTheme;
}

export function normalizeBannerCrop(value: unknown): BannerCrop {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const number = (key: string, fallback: number) => {
    const candidate = Number(source[key]);
    return Number.isFinite(candidate) ? Math.min(100, Math.max(0, candidate)) : fallback;
  };

  return {
    unit: "%",
    x: number("x", DEFAULT_BANNER_CROP.x),
    y: number("y", DEFAULT_BANNER_CROP.y),
    width: number("width", DEFAULT_BANNER_CROP.width),
    height: number("height", DEFAULT_BANNER_CROP.height),
  };
}

export function normalizeBannerFocalPoint(value: unknown): BannerFocalPoint {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const coordinate = (key: string, fallback: number) => {
    const candidate = Number(source[key]);
    return Number.isFinite(candidate) ? Math.min(100, Math.max(0, candidate)) : fallback;
  };

  return {
    x: coordinate("x", DEFAULT_BANNER_FOCAL_POINT.x),
    y: coordinate("y", DEFAULT_BANNER_FOCAL_POINT.y),
  };
}
