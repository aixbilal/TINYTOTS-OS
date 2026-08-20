import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All",
  description:
    "Browse all TinyTots kids clothing — thoughtfully made essentials with free delivery and easy 7-day returns.",
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
