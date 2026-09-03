import type { Metadata } from "next";
import { NOINDEX_NOFOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Forgot Password", robots: NOINDEX_NOFOLLOW };

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
