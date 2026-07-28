"use client";

import type { Metadata } from "next";
import { Geist_Mono, Inter, Plus_Jakarta_Sans, Geist } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import HeaderCart from "@/components/HeaderCart";
import MobileSubNav from "@/components/MobileSubNav";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { WishlistProvider } from "@/lib/wishlist-context";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600"] });
const plusJakarta = Plus_Jakarta_Sans({ variable: "--font-plus-jakarta", subsets: ["latin"], weight: ["600", "700"] });

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<any[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const grouped = filtered.reduce((acc: Record<string, any[]>, p: any) => {
    const key = p.category || "Other";
    (acc[key] = acc[key] || []).push(p);
    return acc;
  }, {});

  return (
    <div
      ref={containerRef}
      className="fixed left-4 right-4 top-[72px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-full sm:max-w-md bg-surface border border-outline-variant/30 rounded-2xl shadow-xl p-4 z-[100]"
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

function AnnouncementBar({ data }: { data: { enabled: boolean; text: string; link: string } | null }) {
  if (!data?.enabled || !data.text) return null;

  const content = (
    <p className="font-label-md text-label-md text-center py-2 px-4 truncate">{data.text}</p>
  );

  return (
    <div className="bg-primary-container text-on-primary w-full">
      {data.link ? (
        <Link href={data.link} className="block hover:opacity-90 transition-opacity">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}

function ShopMenu() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open || categories.length > 0) return;
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => setCategories(json.categories || []))
      .catch(() => setCategories([]));
  }, [open, categories.length]);

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function scheduleHide() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={scheduleHide}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 font-body-md text-body-md pb-1 transition-colors border-b-2 text-on-surface-variant hover:text-primary border-transparent"
      >
        <span className="material-symbols-outlined text-[20px]">storefront</span>
        Shop
        <span className="material-symbols-outlined text-[18px]">{open ? "expand_less" : "expand_more"}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 max-h-96 overflow-y-auto bg-surface border border-outline-variant/30 rounded-2xl shadow-xl p-2 z-[100]">
          <Link
            href="/products"
            className="block px-3 py-2 rounded-lg font-body-md text-body-md text-primary bg-primary-container/20 hover:bg-primary-container/30 transition-colors"
          >
            Shop All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="block px-3 py-2 rounded-lg font-body-md text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MegaMenu() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || categories.length > 0) return;
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => setCategories(json.categories || []))
      .catch(() => setCategories([]));
  }, [open, categories.length]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const MenuLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className="block px-3 py-2 rounded-lg font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
    >
      {label}
    </Link>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 font-body-md text-body-md pb-1 transition-colors border-b-2 ${
          open ? "text-primary border-primary" : "text-on-surface-variant hover:text-primary border-transparent"
        }`}
      >
        Menu
        <span className="material-symbols-outlined text-[20px]">{open ? "expand_less" : "expand_more"}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-[640px] max-w-[90vw] bg-surface border border-outline-variant/30 rounded-2xl shadow-xl p-6 z-[100] grid grid-cols-3 gap-6">
          {/* Column 1: Shopping */}
          <div>
            <p className="font-label-lg text-label-lg text-on-surface font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">storefront</span> Shop
            </p>
            <div className="flex flex-col">
              <MenuLink href="/products" label="Shop All" />
              {categories.map((c) => (
                <MenuLink key={c.slug} href={`/collections/${c.slug}`} label={c.name} />
              ))}
            </div>
          </div>

          {/* Column 2: My TinyTots */}
          <div>
            <p className="font-label-lg text-label-lg text-on-surface font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">person</span> My TinyTots
            </p>
            <div className="flex flex-col">
              <MenuLink href="/account" label="My Account" />
              <MenuLink href="/account/wishlist" label="Wishlist" />
              <MenuLink href="/track-order" label="Track Order" />
              <MenuLink href="/account/returns" label="Returns & Refunds" />
            </div>
          </div>

          {/* Column 3: Company / Info */}
          <div>
            <p className="font-label-lg text-label-lg text-on-surface font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">info</span> More
            </p>
            <div className="flex flex-col">
              <MenuLink href="/blog" label="Blog" />
              <MenuLink href="/our-story" label="Our Story" />
              <MenuLink href="/size-guide" label="Size Guide" />
              <MenuLink href="/help" label="Help Center" />
              <MenuLink href="/contact" label="Contact Us" />
              <MenuLink href="/shipping-returns" label="Shipping & Returns" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileMenu({ open, onClose, topOffset }: { open: boolean; onClose: () => void; topOffset: number }) {
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);

  useEffect(() => {
    if (!open || categories.length > 0) return;
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => setCategories(json.categories || []))
      .catch(() => setCategories([]));
  }, [open, categories.length]);

  if (!open) return null;

  const MenuLink = ({ href, label, icon }: { href: string; label: string; icon?: string }) => (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-3 px-3 py-3 rounded-lg font-body-md text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
    >
      {icon && <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{icon}</span>}
      {label}
    </Link>
  );

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 bg-surface z-[90] overflow-y-auto" style={{ top: topOffset }}>
      <div className="px-margin-mobile py-6 flex flex-col gap-6">
        <div>
          <p className="font-label-lg text-label-lg text-primary font-semibold uppercase tracking-wider mb-1 px-3">Shop</p>
          <MenuLink href="/" label="Home" icon="home" />
          <MenuLink href="/products" label="Shop All" icon="storefront" />
          {categories.map((c) => (
            <MenuLink key={c.slug} href={`/collections/${c.slug}`} label={c.name} />
          ))}
        </div>
        <div>
          <p className="font-label-lg text-label-lg text-primary font-semibold uppercase tracking-wider mb-1 px-3">My TinyTots</p>
          <MenuLink href="/account" label="My Account" icon="person" />
          <MenuLink href="/account/wishlist" label="Wishlist" icon="favorite" />
          <MenuLink href="/track-order" label="Track Order" icon="local_shipping" />
          <MenuLink href="/account/returns" label="Returns & Refunds" icon="assignment_return" />
        </div>
        <div>
          <p className="font-label-lg text-label-lg text-primary font-semibold uppercase tracking-wider mb-1 px-3">More</p>
          <MenuLink href="/blog" label="Blog" icon="article" />
          <MenuLink href="/our-story" label="Our Story" icon="auto_stories" />
          <MenuLink href="/size-guide" label="Size Guide" icon="straighten" />
          <MenuLink href="/help" label="Help Center" icon="help" />
          <MenuLink href="/contact" label="Contact Us" icon="mail" />
          <MenuLink href="/shipping-returns" label="Shipping & Returns" icon="local_shipping" />
        </div>
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
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="hidden sm:inline-block font-body-sm text-body-sm text-on-surface-variant hover:text-primary px-3 py-2 rounded-full transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="font-body-sm text-body-sm bg-primary-container text-on-primary px-4 py-2 rounded-full hover:bg-primary transition-colors whitespace-nowrap"
        >
          Sign up
        </Link>
        <Link
          href="/login"
          className="sm:hidden text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-low p-2 rounded-full flex items-center justify-center"
          title="Log in"
        >
          <span className="material-symbols-outlined">person</span>
        </Link>
      </div>
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
          <Link
            href="/account/wishlist"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low"
          >
            My Wishlist
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

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(json.error || "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return <p className="font-body-sm text-body-sm text-secondary">Thanks for subscribing! 🎉</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row rounded-lg border border-outline-variant/50 overflow-hidden sm:h-[48px]">
        <input
          className="flex-1 min-w-0 bg-transparent border-none px-4 py-3 sm:py-0 font-body-sm text-body-sm text-on-surface focus:ring-0 focus:outline-none"
          placeholder="Email Address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 bg-primary-container text-on-primary px-6 py-3 sm:py-0 font-button text-button hover:bg-primary transition-colors whitespace-nowrap disabled:opacity-60"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </button>
      </div>
      {status === "error" && <p className="font-label-md text-label-md text-error">{errorMsg}</p>}
    </form>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<{ enabled: boolean; text: string; link: string } | null>(null);
  const headerWrapRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(80);

  useEffect(() => {
    fetch("/api/announcement")
      .then((res) => res.json())
      .then(setAnnouncement)
      .catch(() => setAnnouncement(null));
  }, []);

  useEffect(() => {
    if (headerWrapRef.current) setHeaderHeight(headerWrapRef.current.offsetHeight);
  }, [announcement]);
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <html lang="en" className={cn("antialiased", geistMono.variable, inter.variable, plusJakarta.variable, "font-sans", geist.variable)}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" precedence="default" />
      </head>
      <body className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col overflow-x-hidden" style={{ paddingTop: headerHeight }}>
      <AuthProvider>
          <CartProvider>
          <WishlistProvider>
            {/* FIXED NAVBAR WRAPPER (Spans 100% width, centered inside) */}
            <div ref={headerWrapRef} className="fixed top-0 left-0 right-0 z-50">
              <AnnouncementBar data={announcement} />
              <header className="bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
              <nav className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto w-full">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setMobileMenuOpen((o) => !o)}
                    className="md:hidden text-on-surface-variant hover:text-primary p-2 -ml-2 rounded-full flex items-center justify-center"
                    aria-label="Menu"
                  >
                    <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
                  </button>
                  <Link href="/" className="font-display-md text-display-md text-primary tracking-tight">TinyTots</Link>
                  <div className="hidden md:flex items-center gap-6">
                    <Link
                      href="/"
                      title="Home"
                      className={`flex items-center gap-1 font-body-md text-body-md pb-1 transition-colors border-b-2 ${
                        pathname === "/"
                          ? "text-primary font-bold border-primary"
                          : "text-on-surface-variant hover:text-primary border-transparent"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">home</span>
                      Home
                    </Link>
                    <ShopMenu />
                    <MegaMenu />
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
            </header>
            </div>

            <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} topOffset={headerHeight} />
            {!mobileMenuOpen && <MobileSubNav />}

            {/* MAIN CONTENT AREA */}
            <main className="flex-grow w-full max-w-container-max mx-auto min-w-0 px-margin-mobile md:px-margin-desktop">
              {children}
            </main>

            {/* FOOTER */}
            <footer className="bg-surface-container-lowest border-t border-outline-variant/20 w-full mt-stack-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-bento-gap px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto">
                <div className="flex flex-col gap-4">
                  <span className="font-display-lg text-display-lg text-primary">TinyTots</span>
                  <a href="mailto:support@tinytotsofficial.com" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">
                    support@tinytotsofficial.com
                  </a>
                  <p className="font-body-sm text-body-sm text-secondary">© 2026 TinyTots Premium Kids. All rights reserved.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <h4 className="font-headline-md text-headline-md text-on-surface">Explore</h4>
                  <Link href="/products" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">Shop All</Link>
                  <Link href="/our-story" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">About Us</Link>
                  <Link href="/blog" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">Blog</Link>
                </div>
                <div className="flex flex-col gap-3">
                  <h4 className="font-headline-md text-headline-md text-on-surface">Support</h4>
                  <Link href="/help" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">Help Center</Link>
                  <Link href="/contact" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">Contact Us</Link>
                  <Link href="/size-guide" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">Size Guide</Link>
                  <Link href="/track-order" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">Track Order</Link>
                  <Link href="/account/returns" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">Returns & Refunds</Link>
                  <Link href="/report-issue" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">Report an Issue</Link>
                </div>
                <div className="flex flex-col gap-3">
                  <h4 className="font-headline-md text-headline-md text-on-surface">Legal</h4>
                  <Link href="/shipping-returns" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">Shipping &amp; Returns</Link>
                  <Link href="/privacy-policy" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">Privacy Policy</Link>
                  <Link href="/terms" className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary hover:underline">Terms &amp; Conditions</Link>
                </div>
                <div className="flex flex-col gap-4 min-w-0">
                  <h4 className="font-headline-md text-headline-md text-on-surface">Join Our Newsletter</h4>
                  <NewsletterForm />
                </div>
              </div>
            </footer>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}