"use client";

/**
 * Triggers the service worker to pre-fetch and cache every active
 * product's images, so the whole storefront's photos are available
 * offline — not just images the customer happened to scroll past.
 *
 * Page HTML/RSC precaching (products, collections, blog posts) is now
 * handled at service-worker install time by app/serwist/[path]/route.ts's
 * additionalPrecacheEntries, built from the same live product/category/
 * blog query on every deploy — so this file only needs to warm images,
 * which can't be baked into the static precache manifest the same way
 * since there can be hundreds of them and they're not routes.
 */

const WARM_VERSION_KEY = "tt_cache_warmed_v3";

function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

async function getProductImageUrls(): Promise<string[]> {
  try {
    const res = await fetch("/api/all-product-images", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.urls) ? data.urls : [];
  } catch {
    return [];
  }
}

export async function warmFullSiteCache() {
  if (typeof window === "undefined") return;
  if (isOffline()) return;
  if (!("serviceWorker" in navigator)) return;

  // Only re-warm once per deploy — bump WARM_VERSION_KEY's suffix
  // when you want to force a re-warm for all returning visitors.
  if (localStorage.getItem(WARM_VERSION_KEY) === "done") return;

  const registration = await navigator.serviceWorker.ready;
  const controller = registration.active;
  if (!controller) return;

  const imageUrls = await getProductImageUrls();
  if (imageUrls.length > 0) {
    controller.postMessage({ type: "WARM_IMAGES", urls: imageUrls });
  }

  localStorage.setItem(WARM_VERSION_KEY, "done");
}