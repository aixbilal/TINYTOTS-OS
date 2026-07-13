import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link"; // Added Link import
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import HeaderCart from "@/components/HeaderCart";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TinyTots",
  description: "Kids fashion, online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <CartProvider>
          <header className="border-b border-zinc-200 dark:border-zinc-800">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              {/* Added the missing Link component and closing tag */}
              <Link
  href="/"
  className="font-semibold text-lg text-black dark:text-white"
>
  TinyTots
</Link>
<div className="flex items-center gap-4">
  <Link
    href="/track-order"
    className="text-sm font-medium text-black dark:text-white"
  >
    Track Order
  </Link>
  <HeaderCart />
</div>
            </div>
          </header>
          <main className="flex-grow">
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}