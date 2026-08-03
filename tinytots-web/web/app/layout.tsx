import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import Analytics from "@/components/Analytics";
import DeferredStylesheet from "@/components/DeferredStylesheet";
import SerwistProvider from "@/components/SerwistProvider";
import { cn } from "@/lib/utils";
import { getSiteUrl } from "@/lib/site-url";
import { supabaseAnon as supabase } from "@/lib/supabase-anon";

// font-display: optional — avoid late FOUT/layout shift after first paint (CLS).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "optional",
});
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "optional",
});

// Narrow Material Symbols + optional display — deferred load + reserved icon boxes in CSS.
const MATERIAL_SYMBOLS_HREF =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=optional";

const siteUrl = getSiteUrl();
const defaultTitle = "TinyTots | Premium Kids Clothing";
const defaultDescription =
  "Ethically crafted, modern essentials for every stage of your child's early journey. Soft, durable kids clothing with free delivery and easy 7-day returns.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "TinyTots",
  title: {
    default: defaultTitle,
    template: "%s | TinyTots",
  },
  description: defaultDescription,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TinyTots",
  },
  formatDetection: {
    telephone: false,
  },
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

const getAnnouncementForShell = unstable_cache(
  async () => {
    const { data } = await supabase
      .from("homepage_content")
      .select(
        "announcement_enabled, announcement_text, announcement_link, announcement_style"
      )
      .eq("id", 1)
      .maybeSingle();
    return {
      enabled: data?.announcement_enabled ?? false,
      text: data?.announcement_text ?? "",
      link: data?.announcement_link ?? "",
      style: data?.announcement_style ?? "static",
    };
  },
  ["site-shell-announcement"],
  { revalidate: 60 }
);

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const announcement = await getAnnouncementForShell();

  return (
    <html
      lang="en"
      className={cn("antialiased", inter.variable, plusJakarta.variable)}
    >
      <head>
        <DeferredStylesheet href={MATERIAL_SYMBOLS_HREF} />
      </head>
      <body className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <SerwistProvider>
          <SiteShell announcement={announcement}>{children}</SiteShell>
          <Analytics />
        </SerwistProvider>
      </body>
    </html>
  );
}
