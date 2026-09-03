import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

// Public utility form with no standalone content value — reachable and
// link-followed, but not itself an index target.
export const metadata: Metadata = { title: "Track Order", robots: NOINDEX_FOLLOW };

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
