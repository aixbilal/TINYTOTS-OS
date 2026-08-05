"use client";

import { SerwistProvider as Provider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { warmFullSiteCache } from "@/lib/cache-warmer";

/**
 * Registers /serwist/sw.js in production only.
 * cacheOnNavigation is off so cart/checkout aren't warmed into Cache Storage.
 *
 * After the SW is active, we also trigger warmFullSiteCache() once so the
 * whole catalog/blog/policy pages are available offline, not just pages
 * the customer happened to click on.
 */
export default function SerwistProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    warmFullSiteCache();
  }, []);

  return (
    <Provider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV === "development"}
      register
      reloadOnOnline
      cacheOnNavigation={false}
    >
      {children}
    </Provider>
  );
}