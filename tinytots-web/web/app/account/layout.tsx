import type { Metadata } from "next";
import { NOINDEX_NOFOLLOW } from "@/lib/seo";

// Covers /account and every /account/* route.
export const metadata: Metadata = { title: "My Account", robots: NOINDEX_NOFOLLOW };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
