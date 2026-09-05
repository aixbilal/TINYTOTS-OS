import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

// Public utility form with no standalone content value — reachable and
// link-followed, but not itself an index target.
export const metadata: Metadata = { title: "Track Order", robots: NOINDEX_FOLLOW };

// Server Component layout — route segment config takes effect here, not in
// the "use client" page.tsx it wraps. This route was otherwise inheriting a
// static/ISR classification (revalidate: 60) from the root layout's
// unstable_cache announcement fetch, which OpenNext's read-only
// staticAssetsIncrementalCache can never satisfy (K.2-C.6).
export const dynamic = "force-dynamic";

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
