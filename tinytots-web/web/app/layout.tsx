  import type { Metadata } from "next";
  import { Inter, Plus_Jakarta_Sans, Playfair_Display, Geist, JetBrains_Mono } from "next/font/google";
  import "./globals.css";
  import SiteShell from "@/components/SiteShell";
  import Analytics from "@/components/Analytics";
  import SerwistProvider from "@/components/SerwistProvider";
  import IconFontGuard from "@/components/IconFontGuard";
  import { cn } from "@/lib/utils";
  import { getSiteUrl } from "@/lib/site-url";
  import { OG_DEFAULT_IMAGE, OG_LOCALE, SITE_NAME } from "@/lib/seo";

  // swap: on slow networks, optional never applies the webfont and layout looks broken.
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

  // Redesign type scale (TINYTOTS-BUILD-BRIEF.md sec6) — loaded alongside the
  // existing fonts above, not replacing them. See globals.css "NEW — Approved
  // type scale additions" for how these map to display/heading/mono tokens.
  const playfairDisplay = Playfair_Display({
    variable: "--font-playfair",
    subsets: ["latin"],
    weight: ["500", "600", "700"],
    display: "swap",
  });
  const geist = Geist({
    variable: "--font-geist",
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    display: "swap",
  });
  const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
    weight: ["400", "500"],
    display: "swap",
  });

  // Must load in <head> (not after hydration). display=block avoids ligature
  // text leaking as "ho"/"se"/"sh" when the icon font is late on slow networks.
  const MATERIAL_SYMBOLS_HREF =
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block";

  const siteUrl = getSiteUrl();
  const defaultTitle = "TinyTots | Kids Clothing in Pakistan";
  const defaultDescription =
    "Curated children's clothing from TinyTots — local and imported pieces with Cash on Delivery and easy 7-day returns. Free shipping across Pakistan; remote areas may have a delivery fee.";

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
      locale: OG_LOCALE,
      siteName: SITE_NAME,
      title: defaultTitle,
      description: defaultDescription,
      url: siteUrl,
      images: [{ url: OG_DEFAULT_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDescription,
      images: [OG_DEFAULT_IMAGE],
    },
  };

  export default function RootLayout({
    children,
  }: Readonly<{ children: React.ReactNode }>) {
    return (
      <html
        lang="en"
        className={cn(
          "antialiased",
          inter.variable,
          plusJakarta.variable,
          playfairDisplay.variable,
          geist.variable,
          jetbrainsMono.variable
        )}
      >
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link rel="stylesheet" href={MATERIAL_SYMBOLS_HREF} />
        </head>
        <body className="bg-surface-canvas font-body-md text-text-primary antialiased min-h-screen">
          <SerwistProvider>
            <IconFontGuard />
            <SiteShell>{children}</SiteShell>
            <Analytics />
          </SerwistProvider>
        </body>
      </html>
    );
  }
