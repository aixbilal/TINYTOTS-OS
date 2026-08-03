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
 * Custom strategies — do not use defaultCache (it NetworkFirst-caches /api/*
 * and cross-origin hosts, which is unsafe for inventory/pricing/orders).
 */
const runtimeCaching: RuntimeCaching[] = [
  // Never cache APIs
  {
    matcher: ({ url }) => url.pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },
  // Never cache Supabase / Upstash
  {
    matcher: ({ url }) => isSupabaseOrUpstash(url.hostname),
    handler: new NetworkOnly(),
  },
  // Live-only storefront navigations
  {
    matcher: ({ request, url }) =>
      request.mode === "navigate" && isLivePath(url.pathname),
    handler: new NetworkOnly(),
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
  // Stylesheets can change (e.g. display=optional → block) — do not CacheFirst forever.
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
  // Versioned font files — safe to cache aggressively.
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
  // Static images (same-origin public assets; Supabase already NetworkOnly)
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
  // next/image optimizer
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
  // App Router RSC payloads for browsable pages
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
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: WEEK,
        }),
      ],
    }),
  },
  // Page shells — NetworkFirst so offline uses cache, online refreshes
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
