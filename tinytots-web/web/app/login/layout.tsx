import type { Metadata } from "next";
import { NOINDEX_NOFOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Sign In", robots: NOINDEX_NOFOLLOW };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
