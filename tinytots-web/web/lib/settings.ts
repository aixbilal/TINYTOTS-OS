import { supabaseAdmin } from "@/lib/supabase-admin";

const DEFAULTS: Record<string, string> = {
  referral_voucher_amount: "100",
  referral_voucher_valid_days: "30",
  signup_voucher_amount: "200",
  return_refund_voucher_valid_days: "60",
  cod_city_mode: "list",
  // Online (website) pricing — mirrors the DB trigger auto_fill_web_pricing().
  default_web_markup_percent: "25",
  web_round_to: "50",
};

export async function getSetting(key: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error || !data) {
    return DEFAULTS[key] ?? "0";
  }

  return data.value;
}

export async function getSettingNumber(key: string): Promise<number> {
  const raw = await getSetting(key);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : Number(DEFAULTS[key] ?? "0");
}