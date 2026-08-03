import type { Metadata } from "next";
import { Geist_Mono, Inter, Plus_Jakarta_Sans, Geist } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import Analytics from "@/components/Analytics";
import { cn } from "@/lib/utils";
import { getSiteUrl } from "@/lib/site-url";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600"] });
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["600", "700"],
});

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
    icon: "/favicon.ico",
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
      className={cn(
        "antialiased",
        geistMono.variable,
        inter.variable,
        plusJakarta.variable,
        "font-sans",
        geist.variable
      )}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
          precedence="default"
        />
      </head>
      <body className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <SiteShell>{children}</SiteShell>
        <Analytics />
      </body>
    </html>
  );
}
