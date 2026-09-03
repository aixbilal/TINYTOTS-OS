import type { Metadata } from "next";
import { NOINDEX_NOFOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Authenticating", robots: NOINDEX_NOFOLLOW };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
