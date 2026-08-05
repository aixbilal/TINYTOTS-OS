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
export async function fetchWithSessionCache<T>(
  key: string,
  url: string,
  online: boolean,
  select: (json: any) => T
): Promise<{ data: T | null; fromCache: boolean; hadError: boolean }> {
  const cached = readSessionJson<T>(key);

  if (!online) {
    return { data: cached, fromCache: true, hadError: cached === null };
  }

  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    const data = select(json);
    writeSessionJson(key, data);
    return { data, fromCache: false, hadError: false };
  } catch {
    return { data: cached, fromCache: cached !== null, hadError: cached === null };
  }
}
/**
 * Fetch with automatic caching. Checks cache first, falls back to network,
 * persists on success, returns stale cache if offline/fetch fails.
 */
export async function fetchWithCache<T>(
  key: string,
  url: string,
  options?: { ttl?: number }
): Promise<T | null> {
  const ttl = options?.ttl ?? 3600000; // Default 1 hour
  const now = Date.now();

  // Try cache first
  const cached = readSessionJson<{ data: T; timestamp: number }>(key);
  if (cached && now - cached.timestamp < ttl) {
    console.log(`[Cache HIT] ${key}`);
    return cached.data;
  }

  // If offline, return stale cache if available
  if (isBrowserOffline()) {
    console.log(`[Offline] Returning stale cache for ${key}`);
    return cached?.data ?? null;
  }

  // Fetch fresh from network
  console.log(`[Cache MISS] Fetching ${key} from ${url}`);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: T = await res.json();
    
    // Store in cache with timestamp
    writeSessionJson(key, { data, timestamp: now });
    console.log(`[Cache STORE] ${key}`);
    return data;
  } catch (err) {
    console.error(`[Fetch Error] ${key}:`, err);
    // Return stale cache as fallback if fetch fails
    return cached?.data ?? null;
  }
}