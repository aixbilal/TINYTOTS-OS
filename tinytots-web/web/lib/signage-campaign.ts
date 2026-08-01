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

/** Seasonal domain palettes — same layout, different color world per campaign. */
export const CAMPAIGN_THEME_PRESETS: { id: string; label: string; theme: CampaignTheme }[] = [
  {
    id: "autumn-denim",
    label: "Autumn Denim",
    theme: {
      primary: "#7a4a2e",
      secondary: "#3b241a",
      accent: "#c58b5a",
      button: "#9c422e",
      buttonText: "#ffffff",
      badge: "#fffaf5",
      badgeText: "#9c422e",
      background: "#faf5f0",
      surface: "#fffaf7",
      card: "#ffffff",
      text: "#2a221c",
      mutedText: "#7e6e62",
      border: "#e8ddd4",
      icon: "#9c422e",
      footer: "#3b241a",
      footerText: "#ffffff",
    },
  },
  {
    id: "summer-essentials",
    label: "Summer Essentials",
    theme: {
      primary: "#5f7a55",
      secondary: "#2f4630",
      accent: "#9bb58a",
      button: "#5f7a55",
      buttonText: "#ffffff",
      badge: "#f4faf2",
      badgeText: "#3f5a38",
      background: "#f3f7f1",
      surface: "#f8fbf6",
      card: "#ffffff",
      text: "#243024",
      mutedText: "#6a7a66",
      border: "#d7e3d2",
      icon: "#5f7a55",
      footer: "#2f4630",
      footerText: "#ffffff",
    },
  },
  {
    id: "winter-collection",
    label: "Winter Collection",
    theme: {
      primary: "#3d5a80",
      secondary: "#1b2a41",
      accent: "#7ea0c4",
      button: "#3d5a80",
      buttonText: "#ffffff",
      badge: "#f2f6fb",
      badgeText: "#2c4466",
      background: "#f0f5fa",
      surface: "#f7fafc",
      card: "#ffffff",
      text: "#1b2430",
      mutedText: "#66758a",
      border: "#d5e0ec",
      icon: "#3d5a80",
      footer: "#1b2a41",
      footerText: "#ffffff",
    },
  },
  {
    id: "spring-collection",
    label: "Spring Collection",
    theme: {
      primary: "#7a5ea7",
      secondary: "#3d2a5c",
      accent: "#b79fd4",
      button: "#7a5ea7",
      buttonText: "#ffffff",
      badge: "#f8f4fc",
      badgeText: "#5a3f86",
      background: "#f6f2fa",
      surface: "#fbf8fd",
      card: "#ffffff",
      text: "#2a2236",
      mutedText: "#74687f",
      border: "#e4d8ef",
      icon: "#7a5ea7",
      footer: "#3d2a5c",
      footerText: "#ffffff",
    },
  },
];

export const DEFAULT_ROTATION_SECONDS = 18;

/** Core knobs for the palette editor — everything else is derived. */
export type CampaignPaletteCore = {
  brand: string;
  deep: string;
  accent: string;
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function clampByte(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!HEX_COLOR.test(hex)) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((channel) => clampByte(channel).toString(16).padStart(2, "0")).join("")}`;
}

function mixHex(a: string, b: string, weightTowardB: number) {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  if (!left || !right) return HEX_COLOR.test(a) ? a : DEFAULT_CAMPAIGN_THEME.primary;
  const t = Math.min(1, Math.max(0, weightTowardB));
  return rgbToHex(
    left.r + (right.r - left.r) * t,
    left.g + (right.g - left.g) * t,
    left.b + (right.b - left.b) * t
  );
}

function relativeLuminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channel = (value: number) => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

function contrastingText(background: string) {
  return relativeLuminance(background) > 0.45 ? "#1f1a17" : "#ffffff";
}

export function extractPaletteCore(theme: CampaignTheme): CampaignPaletteCore {
  return {
    brand: theme.primary || DEFAULT_CAMPAIGN_THEME.primary,
    deep: theme.secondary || DEFAULT_CAMPAIGN_THEME.secondary,
    accent: theme.accent || DEFAULT_CAMPAIGN_THEME.accent,
  };
}

/**
 * From one seed color, derive deep (darker) + soft accent (lighter wash).
 * Black → charcoal/gray family; blue → navy + soft blue; etc.
 */
export function derivePaletteCoreFromSeed(seed: string): CampaignPaletteCore {
  const brand = HEX_COLOR.test(seed) ? seed.toLowerCase() : DEFAULT_CAMPAIGN_THEME.primary;
  const luminance = relativeLuminance(brand);

  // Very dark seeds (black / near-black): lift brand slightly so UI stays readable,
  // keep footer deep, use neutral gray wash for surfaces.
  if (luminance < 0.08) {
    return {
      brand: mixHex(brand, "#4a4a4a", 0.35),
      deep: mixHex(brand, "#000000", 0.35),
      accent: mixHex("#ffffff", brand, 0.18),
    };
  }

  // Very light seeds: push brand darker so buttons/text contrast.
  if (luminance > 0.78) {
    return {
      brand: mixHex(brand, "#000000", 0.45),
      deep: mixHex(brand, "#000000", 0.65),
      accent: mixHex("#ffffff", brand, 0.35),
    };
  }

  return {
    brand,
    deep: mixHex(brand, "#000000", 0.45),
    accent: mixHex("#ffffff", brand, 0.42),
  };
}

/**
 * Build the full 16-token campaign theme from three custom colors.
 * Brand → buttons/icons/badges; Deep → footer/secondary; Accent → highlights + soft surfaces.
 */
export function buildCampaignThemeFromPalette(core: CampaignPaletteCore): CampaignTheme {
  const brand = HEX_COLOR.test(core.brand) ? core.brand : DEFAULT_CAMPAIGN_THEME.primary;
  const deep = HEX_COLOR.test(core.deep) ? core.deep : DEFAULT_CAMPAIGN_THEME.secondary;
  const accent = HEX_COLOR.test(core.accent) ? core.accent : DEFAULT_CAMPAIGN_THEME.accent;
  const softWash = mixHex("#ffffff", accent, 0.14);
  const softSurface = mixHex("#ffffff", accent, 0.08);
  const softBorder = mixHex("#ffffff", brand, 0.22);
  const muted = mixHex(deep, "#9a9088", 0.55);

  return normalizeCampaignTheme({
    primary: brand,
    secondary: deep,
    accent,
    button: brand,
    buttonText: contrastingText(brand),
    badge: softWash,
    badgeText: brand,
    background: softWash,
    surface: softSurface,
    card: "#ffffff",
    text: mixHex(deep, "#000000", 0.15),
    mutedText: muted,
    border: softBorder,
    icon: brand,
    footer: deep,
    footerText: contrastingText(deep),
  });
}

/** One-click: pick any color → full campaign palette. */
export function buildCampaignThemeFromSeed(seed: string): CampaignTheme {
  return buildCampaignThemeFromPalette(derivePaletteCoreFromSeed(seed));
}

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
