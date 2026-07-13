import type { Metadata } from "next";
import { Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import HeaderCart from "@/components/HeaderCart";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "TinyTots — Premium Kids Clothing",
  description: "Ethically crafted, modern essentials for every stage of your child's early journey.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} ${inter.variable} ${plusJakarta.variable} antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
          precedence="default"
        />
      </head>
      <body className="bg-surface font-body-md text-on-surface antialiased pt-[80px] min-h-screen flex flex-col">
        <CartProvider>
          <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="font-display-md text-display-md text-primary tracking-tight"
              >
                TinyTots
              </Link>
              <div className="hidden md:flex gap-6">
              <Link href="/products" className="font-body-md text-body-md text-primary font-bold border-b-2 border-primary pb-1">
                Shop All
                </Link>
                <Link href="/track-order" className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Track Order
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                className="text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-low p-2 rounded-full flex items-center justify-center"
                title="Search (coming soon)"
              >
                <span className="material-symbols-outlined">search</span>
              </button>
              <button
                className="text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-low p-2 rounded-full flex items-center justify-center"
                title="Account (coming soon)"
              >
                <span className="material-symbols-outlined">person</span>
              </button>
              <HeaderCart />
            </div>
          </nav>

          <main className="flex-grow w-full">{children}</main>

          <footer className="bg-surface-container-lowest border-t border-outline-variant/20 w-full mt-stack-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-bento-gap px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto">
              <div className="flex flex-col gap-4">
                <span className="font-display-lg text-display-lg text-primary">TinyTots</span>
                <p className="font-body-sm text-body-sm text-secondary">
                  © 2026 TinyTots Premium Kids. All rights reserved.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-headline-md text-headline-md text-on-surface">Explore</h4>
                <Link href="/" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">
                  About Us
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-headline-md text-headline-md text-on-surface">Support</h4>
                <Link href="/" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">
                  Shipping Policy
                </Link>
                <Link href="/track-order" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">
                  Track Order
                </Link>
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="font-headline-md text-headline-md text-on-surface">Join Our Newsletter</h4>
                <div className="flex rounded-lg border border-outline-variant/50 overflow-hidden h-[48px]">
                  <input
                    className="flex-1 bg-transparent border-none px-4 font-body-sm text-body-sm text-on-surface focus:ring-0 focus:outline-none"
                    placeholder="Email Address"
                    type="email"
                  />
                  <button className="bg-primary-container text-on-primary px-6 font-button text-button hover:bg-primary transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}