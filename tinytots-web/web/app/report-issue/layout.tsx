import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Report an Issue", robots: NOINDEX_FOLLOW };

export default function ReportIssueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
