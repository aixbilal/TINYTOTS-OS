import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import Analytics from "@/components/Analytics";
import DeferredStylesheet from "@/components/DeferredStylesheet";
import { cn } from "@/lib/utils";
import { getSiteUrl } from "@/lib/site-url";

// Design system uses Inter (body) + Plus Jakarta (display) only — drop unused Geist families.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

// Narrow Material Symbols request (single opsz/weight) — full variable axis range was a major render-block.
const MATERIAL_SYMBOLS_HREF =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap";

const siteUrl = getSiteUrl();
const defaultTitle = "TinyTots | Premium Kids Clothing";
const defaultDescription =
  "Ethically crafted, modern essentials for every stage of your child's early journey. Soft, durable kids clothing with free delivery and easy 7-day returns.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | TinyTots",
  },
  description: defaultDescription,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: "TinyTots",
    title: defaultTitle,
    description: defaultDescription,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("antialiased", inter.variable, plusJakarta.variable)}
    >
      <head>
        <DeferredStylesheet href={MATERIAL_SYMBOLS_HREF} />
      </head>
      <body className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <SiteShell>{children}</SiteShell>
        <Analytics />
      </body>
    </html>
  );
}
