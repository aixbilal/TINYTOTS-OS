import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Report an Issue", robots: NOINDEX_FOLLOW };

// Server Component layout — route segment config takes effect here, not in
// the "use client" page.tsx it wraps. This route was otherwise inheriting a
// static/ISR classification (revalidate: 60) from the root layout's
// unstable_cache announcement fetch, which OpenNext's read-only
// staticAssetsIncrementalCache can never satisfy (K.2-C.6).
export const dynamic = "force-dynamic";

export default function ReportIssueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
