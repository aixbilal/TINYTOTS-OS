"use client";

import type { Metadata } from "next";
import { Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import HeaderCart from "@/components/HeaderCart";

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600"] });
const plusJakarta = Plus_Jakarta_Sans({ variable: "--font-plus-jakarta", subsets: ["latin"], weight: ["600", "700"] });

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim().slice(0, 100); // cap length, avoid junk payloads
    if (!q) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      const filtered = (json.data || []).filter((p: any) =>
        p.name?.toLowerCase().includes(q.toLowerCase())
      );
      setResults(filtered);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
      <div className="bg-surface w-full max-w-xl rounded-2xl shadow-xl p-6">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={100}
            placeholder="Search products..."
            className="flex-1 border border-outline-variant/50 rounded-lg px-4 py-3 bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button type="submit" className="bg-primary-container text-on-primary px-5 rounded-lg font-button text-button hover:bg-primary transition-colors">
            {loading ? "..." : "Go"}
          </button>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-primary px-2">✕</button>
        </form>

        {results.length > 0 && (
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {results.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} onClick={onClose}
                className="flex justify-between px-3 py-2 rounded-lg hover:bg-surface-container-low font-body-sm text-body-sm text-on-surface">
                <span>{p.name}</span>
                <span className="text-on-surface-variant">{p.brand}</span>
              </Link>
            ))}
          </div>
        )}
        {!loading && searched && results.length === 0 && (
          <p className="font-body-sm text-body-sm text-on-surface-variant px-3">
            No products found for &ldquo;{query}&rdquo;.
          </p>
        )}
      </div>
    </div>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  const navLink = (href: string, label: string) => {
    const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
    return (
      <Link
        href={href}
        className={`font-body-md text-body-md pb-1 transition-colors ${
          active
            ? "text-primary font-bold border-b-2 border-primary"
            : "text-on-surface-variant hover:text-primary border-b-2 border-transparent"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <html lang="en" className={`${geistMono.variable} ${inter.variable} ${plusJakarta.variable} antialiased`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" precedence="default" />
      </head>
      <body className="bg-surface font-body-md text-on-surface antialiased pt-[80px] min-h-screen flex flex-col">
        <CartProvider>
          {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}

          <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
            <div className="flex items-center gap-6">
              <Link href="/" className="font-display-md text-display-md text-primary tracking-tight">TinyTots</Link>
              <div className="hidden md:flex gap-6">
                {navLink("/products", "Shop All")}
                {navLink("/track-order", "Track Order")}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setSearchOpen(true)} className="text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-low p-2 rounded-full flex items-center justify-center" title="Search">
                <span className="material-symbols-outlined">search</span>
              </button>
              <button className="text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-low p-2 rounded-full flex items-center justify-center" title="Account (coming soon)">
                <span className="material-symbols-outlined">person</span>
              </button>
              <HeaderCart />
            </div>
          </nav>

          <main className="flex-grow w-full">{children}</main>

          <footer className="bg-surface-container-lowest border-t border-outline-variant/20 w-full mt-stack-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-[1.2fr_1fr_1fr_1.4fr] gap-bento-gap px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto">
              <div className="flex flex-col gap-4">
                <span className="font-display-lg text-display-lg text-primary">TinyTots</span>
                <p className="font-body-sm text-body-sm text-secondary">© 2026 TinyTots Premium Kids. All rights reserved.</p>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-headline-md text-headline-md text-on-surface">Explore</h4>
                <Link href="/our-story" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">About Us</Link>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-headline-md text-headline-md text-on-surface">Support</h4>
                <Link href="/shipping-returns" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">Shipping Policy</Link>
                <Link href="/track-order" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">Track Order</Link>
              </div>
              <div className="flex flex-col gap-4 min-w-0">
                <h4 className="font-headline-md text-headline-md text-on-surface">Join Our Newsletter</h4>
                <div className="flex flex-col sm:flex-row rounded-lg border border-outline-variant/50 overflow-hidden sm:h-[48px]">
                  <input className="flex-1 min-w-0 bg-transparent border-none px-4 py-3 sm:py-0 font-body-sm text-body-sm text-on-surface focus:ring-0 focus:outline-none" placeholder="Email Address" type="email" />
                  <button className="shrink-0 bg-primary-container text-on-primary px-6 py-3 sm:py-0 font-button text-button hover:bg-primary transition-colors whitespace-nowrap">Subscribe</button>
                </div>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}