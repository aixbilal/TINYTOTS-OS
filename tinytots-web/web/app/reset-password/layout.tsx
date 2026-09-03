import type { Metadata } from "next";
import { NOINDEX_NOFOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Reset Password", robots: NOINDEX_NOFOLLOW };

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
