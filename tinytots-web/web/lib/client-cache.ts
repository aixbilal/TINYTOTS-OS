/** Tiny session cache so offline storefront chrome can reuse last-known API data. */

export function readSessionJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeSessionJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / private mode — ignore
  }
}

export const CACHE_KEYS = {
  categories: "tt_categories_v1",
  products: "tt_products_v1",
  productsByQuery: (qs: string) => `tt_products_v1:${qs || "all"}`,
} as const;

export function isBrowserOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}
