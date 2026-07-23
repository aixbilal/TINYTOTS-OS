"use client";

import type { Metadata } from "next";
import { Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import HeaderCart from "@/components/HeaderCart";
import { useAuth } from "@/lib/auth-context";
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600"] });
const plusJakarta = Plus_Jakarta_Sans({ variable: "--font-plus-jakarta", subsets: ["latin"], weight: ["600", "700"] });

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<any[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch the product list once when the overlay opens, then filter
  // in-memory as the user types — this is what makes it feel instant
  // instead of requiring Enter + a round trip on every keystroke.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setAllProducts(json.data || []);
      })
      .catch(() => {
        if (!cancelled) setAllProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close when clicking outside the dropdown, so it behaves like a normal
  // popover instead of a full-screen modal that has to be explicitly closed.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const categories = Array.from(
    new Set((allProducts || []).map((p: any) => p.category).filter(Boolean))
  ) as string[];

  const needle = query.trim().toLowerCase();
  const filtered = (allProducts || []).filter((p: any) => {
    const matchesCategory = !activeCategory || p.category === activeCategory;
    if (!needle) return matchesCategory;
    const haystack = [p.name, p.brand, p.sku, p.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesCategory && haystack.includes(needle);
  });

  // Group results by category so browsing (not just typed search) shows
  // structure — e.g. hovering/clicking "Pants" narrows straight to pants.
  const grouped = filtered.reduce((acc: Record<string, any[]>, p: any) => {
    const key = p.category || "Other";
    (acc[key] = acc[key] || []).push(p);
    return acc;
  }, {});

  return (
    <div
      ref={containerRef}
      className="absolute top-full right-0 mt-2 w-full max-w-md bg-surface border border-outline-variant/30 rounded-2xl shadow-xl p-4 z-[100]"
    >
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        maxLength={100}
        placeholder="Search by name, brand, SKU, or category..."
        className="w-full border border-outline-variant/50 rounded-lg px-4 py-2.5 bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary mb-3"
      />

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              !activeCategory
                ? "bg-primary-container text-on-primary border-primary-container"
                : "border-outline-variant/50 text-on-surface-variant hover:border-primary"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onMouseEnter={() => setActiveCategory(cat)}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                activeCategory === cat
                  ? "bg-primary-container text-on-primary border-primary-container"
                  : "border-outline-variant/50 text-on-surface-variant hover:border-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-80 overflow-y-auto flex flex-col gap-3">
        {Object.keys(grouped).length === 0 && (
          <p className="font-body-sm text-body-sm text-on-surface-variant px-1 py-2">
            {query ? `No products found for \u201c${query}\u201d.` : "No products available."}
          </p>
        )}

        {Object.entries(grouped).map(([category, products]) => (
          <div key={category}>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase px-1 mb-1">
              {category}
            </p>
            <div className="flex flex-col gap-1">
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  onClick={onClose}
                  className="flex justify-between px-3 py-2 rounded-lg hover:bg-surface-container-low font-body-sm text-body-sm text-on-surface"
                >
                  <span>{p.name}</span>
                  <span className="text-on-surface-variant">{p.brand}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountMenu() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-2 rounded-full flex items-center justify-center opacity-50">
        <span className="material-symbols-outlined">person</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-low p-2 rounded-full flex items-center justify-center"
        title="Log in"
      >
        <span className="material-symbols-outlined">person</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-primary hover:bg-surface-container-low p-2 rounded-full flex items-center justify-center"
        title="Account"
      >
        <span className="material-symbols-outlined">account_circle</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-surface border border-outline-variant/30 rounded-xl shadow-lg py-2 z-50">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low"
          >
            My Account
          </Link>
          <button
            onClick={async () => {
              setOpen(false);
              await signOut();
            }}
            className="block w-full text-left px-4 py-2 font-body-sm text-body-sm text-error hover:bg-surface-container-low"
          >
            Log out
          </button>
        </div>
      )}
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
      <AuthProvider>
      <CartProvider>
          <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
            <div className="flex items-center gap-6">
              <Link href="/" className="font-display-md text-display-md text-primary tracking-tight">TinyTots</Link>
              <div className="hidden md:flex gap-6">
                {navLink("/products", "Shop All")}
                {navLink("/track-order", "Track Order")}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button onClick={() => setSearchOpen((o) => !o)} className="text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-low p-2 rounded-full flex items-center justify-center" title="Search">
                  <span className="material-symbols-outlined">search</span>
                </button>
                {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
              </div>
              <AccountMenu />
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
        </AuthProvider>
      </body>
    </html>
  );
}