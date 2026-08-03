"use client";

import { SerwistProvider as Provider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

/**
 * Registers /serwist/sw.js in production only.
 * cacheOnNavigation is off so cart/checkout aren't warmed into Cache Storage.
 */
export default function SerwistProvider({ children }: { children: ReactNode }) {
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
