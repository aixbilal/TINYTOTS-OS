import { supabaseAdmin } from "@/lib/supabase-admin";

// Server-side helper mirroring the whitelist logic in /api/store-contact —
// used by server components that need this data during SSR without an
// internal HTTP round-trip. Keep the PUBLIC_KEYS list in sync with that route.
// (SOCIAL_KEYS are public URLs already rendered on the storefront; they feed
// Organization.sameAs and are not exposed through the /api/store-contact route.)
const PUBLIC_KEYS = ["store_phone", "store_whatsapp", "store_hours", "store_email"];
const SOCIAL_KEYS = ["store_facebook", "store_instagram", "store_tiktok"];

// Fallback support mailbox — the address the storefront Contact and Shipping &
// Returns pages already publish to customers. Overridable via app_settings
// `store_email` without a migration (key/value table).
const DEFAULT_SUPPORT_EMAIL = "support@tinytotsofficial.com";

export type StoreContact = {
  phone: string | null;
  whatsapp: string | null;
  hours: string | null;
  email: string;
  location: string;
  /** Configured official social profile URLs (non-empty only). */
  socials: string[];
};

export async function getStoreContact(): Promise<StoreContact> {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("key, value")
    .in("key", [...PUBLIC_KEYS, ...SOCIAL_KEYS]);

  const settings: Record<string, string> = {};
  if (!error) {
    for (const row of data ?? []) {
      if (row.value) settings[row.key] = row.value;
    }
  }

  return {
    phone: settings.store_phone || null,
    whatsapp: settings.store_whatsapp || null,
    hours: settings.store_hours || null,
    email: settings.store_email || DEFAULT_SUPPORT_EMAIL,
    location: "Toba Tek Singh, Punjab, Pakistan",
    // Only absolute http/https URLs — a bare handle must never reach sameAs.
    socials: SOCIAL_KEYS.map((k) => settings[k])
      .filter(Boolean)
      .filter((v) => /^https?:\/\/[^\s]+$/i.test(v)),
  };
}
