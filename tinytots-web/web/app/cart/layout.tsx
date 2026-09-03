import type { Metadata } from "next";
import { NOINDEX_NOFOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Your Cart", robots: NOINDEX_NOFOLLOW };

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
