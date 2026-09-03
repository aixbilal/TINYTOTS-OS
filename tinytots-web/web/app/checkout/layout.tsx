import type { Metadata } from "next";
import { NOINDEX_NOFOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Checkout", robots: NOINDEX_NOFOLLOW };

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
