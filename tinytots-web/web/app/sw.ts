/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const YEAR = 365 * 24 * 60 * 60;
const WEEK = 7 * 24 * 60 * 60;

const LIVE_PATH_PREFIXES = [
  "/checkout",
  "/cart",
  "/login",
  "/signup",
  "/account",
  "/admin",
  "/forgot-password",
  "/reset-password",
  "/track-order",
  "/order-confirmation",
];

function isLivePath(pathname: string) {
  return LIVE_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isSupabaseOrUpstash(hostname: string) {
  return (
    hostname.endsWith("supabase.co") ||
    hostname.includes("supabase") ||
    hostname.includes("upstash.io")
  );
}

/**
 * Next.js's client router appends a cache-busting `_rsc=<random>` query
 * param to every RSC navigation request — a fresh value on every click,
 * even for the same target route. If we cache/match on the raw request
 * URL, every real navigation is a guaranteed cache miss, forever, because
 * the value it was warmed with can never equal the value generated at
 * click time. We strip that (and any other Next-internal `_`-prefixed
 * params) before the cache reads or writes, so the cache key is stable
 * per-route regardless of when/how the navigation was triggered.
 *
 * Applied both to the runtime NetworkFirst strategy (via plugin) AND to
 * the manual warmCache() writer below, so both sides agree on the key.
 */
const NEXT_INTERNAL_PARAMS = ["_rsc"];

function normalizeCacheKey(request: Request): Request {
  const url = new URL(request.url);
  let changed = false;
  for (const param of NEXT_INTERNAL_PARAMS) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  }
  if (!changed) return request;
  return new Request(url.toString(), request);
}

/** Workbox/Serwist plugin: normalize cache key on both read and write. */
const stripRscParamPlugin = {
  cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
    return normalizeCacheKey(request);
  },
};

/** Never serve stale commerce/auth HTML from the HTTP cache. */
const liveNetworkOnly = new NetworkOnly({
  fetchOptions: { cache: "no-store" },
});

/**
 * Custom strategies — do not use defaultCache (it NetworkFirst-caches /api/*
 * and cross-origin hosts, which is unsafe for inventory/pricing/orders).
 */
const runtimeCaching: RuntimeCaching[] = [
  // Never cache APIs (all methods — Workbox matches GET by default per entry)
  {
    matcher: ({ url }) => url.pathname.startsWith("/api/"),
    handler: liveNetworkOnly,
    method: "GET",
  },
  {
    matcher: ({ url }) => url.pathname.startsWith("/api/"),
    handler: liveNetworkOnly,
    method: "POST",
  },
  {
    matcher: ({ url }) => url.pathname.startsWith("/api/"),
    handler: liveNetworkOnly,
    method: "PUT",
  },
  {
    matcher: ({ url }) => url.pathname.startsWith("/api/"),
    handler: liveNetworkOnly,
    method: "PATCH",
  },
  {
    matcher: ({ url }) => url.pathname.startsWith("/api/"),
    handler: liveNetworkOnly,
    method: "DELETE",
  },
  // Never cache Supabase / Upstash
  {
    matcher: ({ url }) => isSupabaseOrUpstash(url.hostname),
    handler: liveNetworkOnly,
  },
  // Live-only storefront navigations
  {
    matcher: ({ request, url }) =>
      request.mode === "navigate" && isLivePath(url.pathname),
    handler: liveNetworkOnly,
  },
  // Live-only RSC (client navigations to cart/checkout/auth)
  {
    matcher: ({ request, url, sameOrigin }) =>
      sameOrigin &&
      request.headers.get("RSC") === "1" &&
      isLivePath(url.pathname),
    handler: liveNetworkOnly,
  },
  // Hashed Next build assets
  {
    matcher: /\/_next\/static\/.*/i,
    handler: new CacheFirst({
      cacheName: "next-static",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 256,
          maxAgeSeconds: YEAR,
        }),
      ],
    }),
  },
  // Fonts
  {
    matcher: /\.(?:woff2?|ttf|otf)$/i,
    handler: new CacheFirst({
      cacheName: "fonts",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: YEAR,
        }),
      ],
    }),
  },
  {
    matcher: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    handler: new StaleWhileRevalidate({
      cacheName: "google-fonts-css-v2",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 8,
          maxAgeSeconds: WEEK,
        }),
      ],
    }),
  },
  {
    matcher: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    handler: new CacheFirst({
      cacheName: "google-fonts-files-v2",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 24,
          maxAgeSeconds: YEAR,
        }),
      ],
    }),
  },
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin && /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i.test(url.pathname),
    handler: new CacheFirst({
      cacheName: "static-images",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 128,
          maxAgeSeconds: YEAR,
        }),
      ],
    }),
  },
  {
    matcher: /\/_next\/image\?.*/i,
    handler: new StaleWhileRevalidate({
      cacheName: "next-image",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 96,
          maxAgeSeconds: WEEK,
        }),
      ],
    }),
  },
  {
    matcher: ({ request, url, sameOrigin }) =>
      sameOrigin &&
      request.headers.get("RSC") === "1" &&
      !url.pathname.startsWith("/api/") &&
      !isLivePath(url.pathname),
    handler: new NetworkFirst({
      cacheName: "pages-rsc",
      networkTimeoutSeconds: 5,
      plugins: [
        // MUST come before ExpirationPlugin so the key is already
        // normalized when Expiration tracks/evicts entries.
        stripRscParamPlugin,
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: WEEK,
        }),
      ],
    }),
  },
  {
    matcher: ({ request, url }) =>
      request.mode === "navigate" && !isLivePath(url.pathname),
    handler: new NetworkFirst({
      cacheName: "pages",
      networkTimeoutSeconds: 5,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: WEEK,
        }),
      ],
    }),
  },
];
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

/**
 * Full-site warm cache: the page posts a list of URLs (products, blog
 * posts, policy pages) to this worker, and we fetch + store each one
 * directly into the same "pages" / "pages-rsc" caches that the normal
 * NetworkFirst navigation rules read from. This is the only way to
 * populate those caches without the customer actually visiting every
 * page first, since background fetch() calls don't have
 * request.mode === "navigate" and would otherwise be ignored by the
 * runtimeCaching rules above.
 *
 * NOTE: these URLs come from the sitemap (clean, no `_rsc` param), which
 * already matches the normalized key the stripRscParamPlugin produces at
 * read time — so no change needed here, but see normalizeCacheKey() above
 * for why this now actually matches on real navigations.
 */
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const data = event.data as { type?: string; urls?: string[] } | undefined;
  if (!data || data.type !== "WARM_CACHE" || !Array.isArray(data.urls)) return;

  event.waitUntil(warmCache(data.urls));
});

async function warmCache(urls: string[]) {
  const pageCache = await caches.open("pages");
  const rscCache = await caches.open("pages-rsc");

  for (const url of urls) {
    // Full HTML (for direct navigation offline)
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) await pageCache.put(url, res.clone());
    } catch {
      // ignore individual failures, keep warming the rest
    }

    // RSC payload (for client-side <Link> navigation offline)
    try {
      const rscRes = await fetch(url, {
        cache: "no-store",
        headers: { RSC: "1" },
      });
      if (rscRes.ok) await rscCache.put(url, rscRes.clone());
    } catch {
      // ignore
    }

    // Small delay so we don't hammer the server/DB with hundreds of
    // simultaneous requests on first visit.
    await new Promise((r) => setTimeout(r, 150));
  }
}