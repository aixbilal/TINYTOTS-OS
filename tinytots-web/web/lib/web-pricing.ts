/**
 * Channel-pricing preview math — a faithful mirror of the database trigger
 * public.auto_fill_web_pricing() (migration 20260903120000).
 *
 * The DATABASE stays authoritative for what is actually stored/charged. This
 * is only so Admin screens can show the operator the same number the DB will
 * compute, before the row is written. Keep the two in sync.
 *
 *   physical shop price  ─┐
 *                         ├─ web base = shop price × (1 + markup%)      [unlocked]
 *   locked web base  ─────┘  (locked: manual web base kept as-is)
 *   web base − web discount% ─→ round UP to nearest `roundTo` ─→ web price
 */

export type WebPriceInputs = {
  /** Physical-shop base price (variants.base_price, falls back to price). */
  shopBasePrice: number;
  /** Global default markup %, from app_settings.default_web_markup_percent. */
  markupPercent: number;
  /** variants.web_discount_percent. */
  webDiscountPercent?: number;
  /** Rounding step: per-variant override, else global app_settings.web_round_to. */
  roundTo: number;
  /** variants.web_price_locked. */
  locked?: boolean;
  /** Manual web base price used when locked. */
  lockedWebBasePrice?: number | null;
};

export type WebPriceResult = {
  webBasePrice: number;
  webPrice: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeWebPrice(input: WebPriceInputs): WebPriceResult {
  const markup = Number.isFinite(input.markupPercent) && input.markupPercent >= 0 ? input.markupPercent : 25;
  const roundTo = Number.isFinite(input.roundTo) && input.roundTo > 0 ? input.roundTo : 50;
  const discount = Number.isFinite(input.webDiscountPercent ?? 0) ? input.webDiscountPercent ?? 0 : 0;
  const shop = Number.isFinite(input.shopBasePrice) && input.shopBasePrice >= 0 ? input.shopBasePrice : 0;

  let webBasePrice: number;
  if (input.locked && input.lockedWebBasePrice != null && Number.isFinite(input.lockedWebBasePrice)) {
    webBasePrice = round2(input.lockedWebBasePrice);
  } else {
    webBasePrice = round2(shop * (1 + markup / 100));
  }

  const discounted = round2(webBasePrice * (1 - discount / 100));
  const webPrice = Math.ceil(discounted / roundTo) * roundTo;

  return { webBasePrice, webPrice };
}

/** Rs. formatting used across admin pricing previews. */
export function formatRs(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `Rs. ${Math.round(n).toLocaleString("en-PK")}`;
}
