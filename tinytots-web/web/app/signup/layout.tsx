import type { Metadata } from "next";
import { NOINDEX_NOFOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Create Account", robots: NOINDEX_NOFOLLOW };

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
