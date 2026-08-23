"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TinyTotsBrand from "@/components/TinyTotsBrand";
import HeaderUtilities from "@/components/HeaderUtilities";

// TINYTOTS BRAND | CENTERED NAVIGATION | UTILITIES — every other
// customer-facing route. The brand itself already links home, so the
// nav doesn't repeat a separate "Home" text link next to it.
//
// This composition needs more horizontal room than the Homepage's (a
// full-width brand+tagline on one side, 7 nav links, and text-based
// Sign in/Sign up on the other all in one row), so the "desktop" cutover
// here is lg (1024px) rather than the site's usual md (768px) — measured
// against the real column budget at 768px, not guessed. Below lg it falls
// back to the same hamburger + centered-brand treatment as mobile, per
// "at tablet/mobile: use the existing mobile header/menu behavior."
export default function InternalHeader({
  mobileMenuOpen,
  onToggleMobileMenu,
  onSearchClick,
}: {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onSearchClick: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="grid grid-cols-[1fr_auto_1fr] items-center px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto w-full">
      <div className="flex items-center gap-6 justify-start">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden text-text-secondary hover:text-brand-primary p-2 -ml-2 rounded-full flex items-center justify-center"
          aria-label="Menu"
        >
          <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
        </button>
        <TinyTotsBrand className="hidden lg:flex" />
      </div>

      <div className="justify-self-center flex items-center gap-4 lg:gap-5 flex-nowrap whitespace-nowrap">
        <TinyTotsBrand className="lg:hidden" />
        <div className="hidden lg:flex items-center gap-4 lg:gap-5 flex-nowrap whitespace-nowrap">
          <Link
            href="/products?sort=newest"
            className={`font-body-md text-body-md pb-1 transition-colors border-b-2 ${
              pathname === "/products" ? "text-brand-primary border-brand-primary" : "text-text-secondary hover:text-brand-primary border-transparent"
            }`}
          >
            New In
          </Link>
          <Link
            href="/products?gender=girl"
            className="font-body-md text-body-md pb-1 transition-colors border-b-2 text-text-secondary hover:text-brand-primary border-transparent"
          >
            Girls
          </Link>
          <Link
            href="/products?gender=boy"
            className="font-body-md text-body-md pb-1 transition-colors border-b-2 text-text-secondary hover:text-brand-primary border-transparent"
          >
            Boys
          </Link>
          <Link
            href="/collections"
            className={`font-body-md text-body-md pb-1 transition-colors border-b-2 ${
              pathname === "/collections" ? "text-brand-primary border-brand-primary" : "text-text-secondary hover:text-brand-primary border-transparent"
            }`}
          >
            Collections
          </Link>
          <Link
            href="/our-story"
            className={`font-body-md text-body-md pb-1 transition-colors border-b-2 ${
              pathname === "/our-story" ? "text-brand-primary border-brand-primary" : "text-text-secondary hover:text-brand-primary border-transparent"
            }`}
          >
            About
          </Link>
          <Link
            href="/blog"
            className={`font-body-md text-body-md pb-1 transition-colors border-b-2 ${
              pathname?.startsWith("/blog") ? "text-brand-primary border-brand-primary" : "text-text-secondary hover:text-brand-primary border-transparent"
            }`}
          >
            Blog
          </Link>
          <Link
            href="/help"
            className={`font-body-md text-body-md pb-1 transition-colors border-b-2 ${
              pathname === "/help" ? "text-brand-primary border-brand-primary" : "text-text-secondary hover:text-brand-primary border-transparent"
            }`}
          >
            Help
          </Link>
        </div>
      </div>

      <HeaderUtilities onSearchClick={onSearchClick} />
    </nav>
  );
}
