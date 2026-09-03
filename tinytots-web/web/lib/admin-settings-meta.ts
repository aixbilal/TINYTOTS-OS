// Per-key metadata for the Admin → Settings screen so each app_settings row
// renders with a human label, the right input type, and a grouping section
// (instead of one generic type="number" field for every key).

export type SettingType = "number" | "percent" | "text" | "tel" | "url" | "select";

export interface SettingMeta {
  label: string;
  section: string;
  type: SettingType;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export const SETTINGS_SECTIONS = [
  "Rewards & discounts",
  "Store operations",
  "Store profile",
  "Social profiles",
  "Other",
] as const;

export const SETTINGS_META: Record<string, SettingMeta> = {
  signup_voucher_amount: {
    label: "Signup voucher amount (Rs.)",
    section: "Rewards & discounts",
    type: "number",
    help: "Credited to a new customer on signup.",
  },
  referral_voucher_amount: {
    label: "Referral reward amount (Rs.)",
    section: "Rewards & discounts",
    type: "number",
    help: "Credited to the referrer when their reward is issued.",
  },
  referral_voucher_valid_days: {
    label: "Referral voucher validity (days)",
    section: "Rewards & discounts",
    type: "number",
    help: "Days until an issued referral voucher expires.",
  },
  referee_discount_amount: {
    label: "Referee discount (Rs.)",
    section: "Rewards & discounts",
    type: "number",
    help: "Instant discount for whoever redeems a referral code at checkout.",
  },
  max_discount_percent_of_subtotal: {
    label: "Max coupon + referral discount (% of subtotal)",
    section: "Rewards & discounts",
    type: "percent",
    help: "Cap on coupon + referral discount combined. Vouchers are excluded from this cap.",
  },
  cod_city_mode: {
    label: "Cash on Delivery coverage",
    section: "Store operations",
    type: "select",
    help: "“All of Pakistan” accepts COD everywhere. “Selected cities” restricts it to the Delivery Cities list.",
    options: [
      { value: "all_pakistan", label: "All of Pakistan" },
      { value: "list", label: "Selected cities only" },
    ],
  },
  store_phone: {
    label: "Support phone",
    section: "Store profile",
    type: "tel",
    placeholder: "0333-5268060",
    help: "Shown on the storefront contact / shipping pages.",
  },
  store_whatsapp: {
    label: "WhatsApp business number",
    section: "Store profile",
    type: "tel",
    placeholder: "+923001234567",
  },
  store_hours: {
    label: "Business hours",
    section: "Store profile",
    type: "text",
    placeholder: "e.g. Mon–Sat, 10am–8pm",
  },
  store_facebook: {
    label: "Facebook profile URL",
    section: "Social profiles",
    type: "url",
    placeholder: "https://facebook.com/YourPage",
    help: "Use the full https:// profile URL — it feeds the site's Organization structured data.",
  },
  store_instagram: {
    label: "Instagram profile URL",
    section: "Social profiles",
    type: "url",
    placeholder: "https://instagram.com/yourhandle",
    help: "Use the full https:// profile URL.",
  },
  store_tiktok: {
    label: "TikTok profile URL",
    section: "Social profiles",
    type: "url",
    placeholder: "https://tiktok.com/@yourhandle",
    help: "Use the full https:// profile URL.",
  },
};

export function metaFor(key: string): SettingMeta {
  return (
    SETTINGS_META[key] || {
      label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      section: "Other",
      type: "text",
    }
  );
}

/** True when a URL string is an absolute http/https URL (used for sameAs safety
 *  and settings validation). */
export function isAbsoluteHttpUrl(v: string | null | undefined): boolean {
  if (!v) return false;
  try {
    const u = new URL(v.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
