import type { Metadata } from "next";
import { NOINDEX_NOFOLLOW } from "@/lib/seo";

// Covers /account and every /account/* route.
export const metadata: Metadata = { title: "My Account", robots: NOINDEX_NOFOLLOW };

// Server Component layout — route segment config takes effect here, not in
// the "use client" page.tsx files it wraps. Every /account/* page is
// session-dependent and was otherwise inheriting a static/ISR classification
// (revalidate: 60) from the root layout's unstable_cache announcement fetch,
// which OpenNext's read-only staticAssetsIncrementalCache can never satisfy
// (K.2-C.3): forcing dynamic here removes the stale-page/failed-cache-write
// path for the whole account tree in one place.
export const dynamic = "force-dynamic";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
