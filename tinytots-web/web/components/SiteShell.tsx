"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import CartStickyBar from "@/components/CartStickyBar";
import MobileSubNav from "@/components/MobileSubNav";
import { shouldShowFooterFaq } from "@/components/FooterFaq";
import { WishlistProvider } from "@/lib/wishlist-context";
import HomepageHeader from "@/components/HomepageHeader";
import InternalHeader from "@/components/InternalHeader";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";
import { CACHE_KEYS, readSessionJson, writeSessionJson } from "@/lib/client-cache";
import { useOnline } from "@/hooks/useOnline";
import { useCart } from "@/lib/cart-context";
import SearchTakeover from "@/components/SearchTakeover";

// Below-fold chrome — keep off the homepage critical JS path.
const UgcFeed = dynamic(() => import("@/components/UgcFeed"), { ssr: false });
const FooterFaq = dynamic(() => import("@/components/FooterFaq"), { ssr: false });
const ProductFinder = dynamic(() => import("@/components/ProductFinder"), { ssr: false });

export type AnnouncementData = {
  enabled: boolean;
  text: string;
  link: string;
  style?: string;
};

function AnnouncementBar({ data }: { data: { enabled: boolean; text: string; link: string; style?: string } | null }) {
  if (!data?.enabled || !data.text) return null;

  const isMarquee = data.style === "marquee";

  const content = isMarquee ? (
    <div className="overflow-hidden whitespace-nowrap">
      <div className="marquee-track">
        <span className="font-label-md text-label-md px-10 py-2 shrink-0">{data.text}</span>
        <span className="font-label-md text-label-md px-10 py-2 shrink-0" aria-hidden="true">{data.text}</span>
      </div>
    </div>
  ) : (
    <p className="font-label-md text-label-md text-center py-2 px-4 truncate">{data.text}</p>
  );

  return (
    <div className="bg-brand-primary text-white w-full">
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

// Fixed, non-admin-editable Pakistan-policy strip shown on internal pages
// only - deliberately NOT driven by homepage_content.announcement_* so
// editing the Homepage's announcement in admin never affects internal
// pages, and vice versa. Static real business policy, not marketing copy.
function InternalAnnouncementBar() {
  return (
    <div className="bg-brand-primary text-white w-full">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex items-center justify-between gap-4 py-2">
        <span className="font-label-md text-label-md truncate">Free shipping across Pakistan</span>
        <span className="font-label-md text-label-md hidden sm:flex items-center gap-4 shrink-0">
          <span>Easy 7-day returns</span>
          <Link href="/help" className="hover:underline">Help</Link>
        </span>
      </div>
    </div>
  );
}

function MobileMenu({
  open,
  onClose,
  topOffset,
  onSearch,
}: {
  open: boolean;
  onClose: () => void;
  topOffset: number;
  onSearch: () => void;
}) {
  const online = useOnline();
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    const cached = readSessionJson<{ name: string; slug: string }[]>(CACHE_KEYS.categories) ?? [];
    if (cached.length > 0) setCategories(cached);
    if (!online) return;

    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        const list = json.categories || [];
        setCategories(list);
        writeSessionJson(CACHE_KEYS.categories, list);
      })
      .catch(() => {
        const fallback = readSessionJson<{ name: string; slug: string }[]>(CACHE_KEYS.categories);
        if (fallback?.length) setCategories(fallback);
      });
  }, [open, online]);

  if (!open) return null;

  const MenuLink = ({ href, label, icon }: { href: string; label: string; icon?: string }) => (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-3 px-3 py-3 rounded-lg font-body-md text-body-md text-text-primary hover:bg-surface-secondary transition-colors"
    >
      {icon && <span className="material-symbols-outlined text-[20px] text-text-secondary">{icon}</span>}
      {label}
    </Link>
  );

  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 bg-surface-canvas z-[90] overflow-y-auto" style={{ top: topOffset }}>
      <div className="px-margin-mobile py-6 flex flex-col gap-6">
        <div>
          <p className="font-label-lg text-label-lg text-brand-primary font-semibold uppercase tracking-wider mb-1 px-3">Shop</p>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSearch();
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg font-body-md text-body-md text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-text-secondary">search</span>
            Search
          </button>
          <MenuLink href="/" label="Home" icon="home" />
          <MenuLink href="/products" label="Shop All" icon="storefront" />
          {categories.map((c) => (
            <MenuLink key={c.slug} href={`/collections/${c.slug}`} label={c.name} />
          ))}
          {categories.length === 0 && (
            <p className="px-3 py-2 font-body-sm text-body-sm text-text-secondary">
              {online ? "Loading categories…" : "Categories unavailable offline"}
            </p>
          )}
        </div>
        <div>
          <p className="font-label-lg text-label-lg text-brand-primary font-semibold uppercase tracking-wider mb-1 px-3">My TinyTots</p>
          <MenuLink href="/login" label="Sign in" icon="login" />
          <MenuLink href="/signup" label="Sign up" icon="person_add" />
          <MenuLink href="/account" label="My Account" icon="person" />
          <MenuLink href="/cart" label="Cart" icon="shopping_bag" />
          <MenuLink href="/account/wishlist" label="Wishlist" icon="favorite" />
          <MenuLink href="/track-order" label="Track Order" icon="local_shipping" />
          <MenuLink href="/account/returns" label="Returns & Refunds" icon="assignment_return" />
        </div>
        <div>
          <p className="font-label-lg text-label-lg text-brand-primary font-semibold uppercase tracking-wider mb-1 px-3">More</p>
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

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    if (!isValidEmail(email)) {
      setStatus("error");
      setErrorMsg(EMAIL_ERROR);
      return;
    }
    setStatus("loading");
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
    return <p className="font-body-sm text-body-sm text-text-secondary">Thanks for subscribing! 🎉</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full max-w-[320px]">
      <div className="flex flex-col rounded-xl border border-border-default overflow-hidden bg-surface-elevated">
        <input
          className="w-full min-w-0 bg-transparent border-none px-4 py-3 font-body-sm text-body-sm text-text-primary placeholder:text-text-secondary/70 focus:ring-0 focus:outline-none"
          placeholder="Email Address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-brand-primary text-white px-6 py-3 font-button text-button hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-60"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </button>
      </div>
      {status === "error" && <p className="font-label-md text-label-md text-red-700">{errorMsg}</p>}
    </form>
  );
}

function StickyBarSpacer() {
  const { cartBarVisible, totalItems } = useCart();
  const pathname = usePathname();
  const hide =
    pathname?.startsWith("/cart") ||
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/signage");
  if (!cartBarVisible || totalItems <= 0 || hide) return null;
  // Reserves scroll room so the fixed sticky bar never covers footer/content.
  return <div className="h-24 md:h-20 w-full shrink-0" aria-hidden />;
}

function MainContent({ children }: { children: ReactNode }) {
  const { cartBarVisible, totalItems } = useCart();
  const pathname = usePathname();
  const padForBar =
    cartBarVisible &&
    totalItems > 0 &&
    !pathname?.startsWith("/cart") &&
    !pathname?.startsWith("/checkout") &&
    !pathname?.startsWith("/signage");

  return (
    <main
      className={`w-full max-w-container-max mx-auto min-w-0 px-margin-mobile md:px-margin-desktop ${
        padForBar ? "pb-28" : "pb-8"
      }`}
    >
      {children}
    </main>
  );
}

export default function SiteShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const headerWrapRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(80);
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  // Fetched client-side, homepage-only (see effect below) — avoids running the
  // announcement query on every route via the root layout, which is what
  // produced read-only-incremental-cache write errors under OpenNext
  // (K.2-C.8). No prop from RootLayout anymore.
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);

  useEffect(() => {
    if (mobileMenuOpen) setHeaderHidden(false);
  }, [mobileMenuOpen]);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    let ticking = false;

    function handleScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const last = lastScrollYRef.current;
        const delta = currentY - last;

        // Ignore tiny jitter and don't hide until scrolled past the header
        // itself, so the bar doesn't flicker while still at the very top.
        if (Math.abs(delta) > 4 && currentY > headerHeight) {
          setHeaderHidden(delta > 0);
        } else if (currentY <= headerHeight) {
          setHeaderHidden(false);
        }
        lastScrollYRef.current = currentY;
        ticking = false;
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headerHeight]);

  useEffect(() => {
    const el = headerWrapRef.current;
    if (!el) return;
    const measure = () => setHeaderHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [announcement]);
  const pathname = usePathname();

  // Homepage-only: the editable announcement is only ever displayed on "/"
  // (see the pathname === "/" branch below), so only fetch it there. Internal
  // pages use the static InternalAnnouncementBar and must never call this.
  useEffect(() => {
    if (pathname !== "/") return;
    let cancelled = false;

    fetch("/api/announcement")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setAnnouncement(data);
      })
      .catch(() => {
        if (!cancelled) setAnnouncement(null);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const isSignage = pathname?.startsWith("/signage");
  // The Admin back office ships its own application shell (header, sidebar,
  // auth provider) in app/admin/layout.tsx — it must never render inside the
  // customer storefront chrome (announcement bar, storefront header, cart /
  // wishlist, marketing footer, newsletter, UGC feed).
  const isAdmin = pathname === "/admin" || pathname?.startsWith("/admin/");

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isSignage) {
    return <div className="min-h-screen overflow-hidden">{children}</div>;
  }

  if (isAdmin) {
    return <div className="min-h-screen bg-surface-canvas">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ paddingTop: headerHeight }}>
      <AuthProvider>
          <CartProvider>
          <WishlistProvider>
            {/* FIXED NAVBAR WRAPPER (Spans 100% width, centered inside) */}
            <div
              ref={headerWrapRef}
              className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out"
              style={{ transform: headerHidden || searchOpen ? "translateY(-100%)" : "translateY(0)" }}
            >
              {pathname === "/" ? <AnnouncementBar data={announcement} /> : <InternalAnnouncementBar />}
              <header className="bg-surface-canvas/80 backdrop-blur-md border-b border-border-default">
              {pathname === "/" ? (
                <HomepageHeader
                  mobileMenuOpen={mobileMenuOpen}
                  onToggleMobileMenu={() => setMobileMenuOpen((o) => !o)}
                  onSearchClick={() => setSearchOpen(true)}
                />
              ) : (
                <InternalHeader
                  mobileMenuOpen={mobileMenuOpen}
                  onToggleMobileMenu={() => setMobileMenuOpen((o) => !o)}
                  onSearchClick={() => setSearchOpen(true)}
                />
              )}
            </header>
            </div>

            <MobileMenu
              open={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
              topOffset={headerHeight}
              onSearch={() => setSearchOpen(true)}
            />
            <SearchTakeover open={searchOpen} onClose={() => setSearchOpen(false)} />
            {!mobileMenuOpen && <MobileSubNav />}
            <CartStickyBar />
            <ProductFinder />

            {/* MAIN CONTENT — no flex-grow (that created a huge empty gap above the footer) */}
            <MainContent>{children}</MainContent>

            <div className="mt-auto w-full">
              <UgcFeed />
              {shouldShowFooterFaq(pathname) && <FooterFaq />}
              <footer className="bg-surface-secondary border-t border-border-default w-full">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-8 px-margin-mobile md:px-margin-desktop pt-10 md:pt-12 max-w-container-max mx-auto">
                  <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
                    <span className="font-headline-lg text-headline-lg text-brand-primary tracking-tight">TinyTots</span>
                    <p className="font-label-md text-label-md text-text-secondary uppercase tracking-wider -mt-2">
                      Timeless for tiny hearts
                    </p>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <h4 className="font-label-lg text-label-lg text-text-primary font-semibold uppercase tracking-wider mb-1">Shop</h4>
                    <Link href="/products?sort=newest" className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors">New In</Link>
                    <Link href="/products?gender=girl" className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors">Girls</Link>
                    <Link href="/products?gender=boy" className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors">Boys</Link>
                    <Link href="/collections" className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors">Collections</Link>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <h4 className="font-label-lg text-label-lg text-text-primary font-semibold uppercase tracking-wider mb-1">Help</h4>
                    <Link href="/help" className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors">Help Center</Link>
                    <Link href="/track-order" className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors">Track Order</Link>
                    <Link href="/size-guide" className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors">Size Guide</Link>
                    <Link href="/shipping-returns" className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors">Shipping &amp; Delivery</Link>
                    <Link href="/account/returns" className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors">Returns &amp; Exchanges</Link>
                    <Link href="/help" className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors">FAQ</Link>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <h4 className="font-label-lg text-label-lg text-text-primary font-semibold uppercase tracking-wider mb-1">About</h4>
                    <Link href="/our-story" className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors">Our Story</Link>
                    <Link href="/blog" className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors">Journal</Link>
                    <Link href="/contact" className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors">Contact Us</Link>
                    <Link href="/report-issue" className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors">Report an Issue</Link>
                  </div>
                  <div className="col-span-2 md:col-span-1 flex flex-col gap-3 min-w-0 pt-2 md:pt-0 border-t border-border-default md:border-0">
                    <h4 className="font-label-lg text-label-lg text-text-primary font-semibold uppercase tracking-wider">Join Our Family</h4>
                    <p className="font-body-sm text-body-sm text-text-secondary -mt-2">
                      Sign up for new arrivals, special offers &amp; little inspirations.
                    </p>
                    <NewsletterForm />
                  </div>
                </div>
                <div className="border-t border-border-default mt-8">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-margin-mobile md:px-margin-desktop py-5 max-w-container-max mx-auto">
                    <p className="font-label-md text-label-md text-text-secondary">
                      © {new Date().getFullYear()} TinyTots. All rights reserved.
                    </p>
                    <div className="flex items-center gap-5">
                      <Link href="/terms" className="font-label-md text-label-md text-text-secondary hover:text-brand-primary transition-colors">Terms &amp; Conditions</Link>
                      <Link href="/privacy-policy" className="font-label-md text-label-md text-text-secondary hover:text-brand-primary transition-colors">Privacy Policy</Link>
                    </div>
                  </div>
                </div>
              </footer>
              <StickyBarSpacer />
            </div>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
    </div>
  );
}