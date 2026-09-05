import type { Metadata } from "next";
import { NOINDEX_NOFOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Checkout", robots: NOINDEX_NOFOLLOW };

// Server Component layout — route segment config takes effect here, not in
// the "use client" page.tsx it wraps. This route was otherwise inheriting a
// static/ISR classification (revalidate: 60) from the root layout's
// unstable_cache announcement fetch, which OpenNext's read-only
// staticAssetsIncrementalCache can never satisfy (K.2-C.6).
export const dynamic = "force-dynamic";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
