import { supabaseAdmin } from "@/lib/supabase-admin";

// Server-side helper mirroring the whitelist logic in /api/store-contact —
// used by server components that need this data during SSR without an
// internal HTTP round-trip. Keep the PUBLIC_KEYS list in sync with that route.
const PUBLIC_KEYS = ["store_phone", "store_whatsapp", "store_hours"];

export type StoreContact = {
  phone: string | null;
  whatsapp: string | null;
  hours: string | null;
  email: string;
  location: string;
};

export async function getStoreContact(): Promise<StoreContact> {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("key, value")
    .in("key", PUBLIC_KEYS);

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
    email: "support@tinytotsofficial.com",
    location: "Toba Tek Singh, Punjab, Pakistan",
  };
}
