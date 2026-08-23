import Link from "next/link";
import TinyTotsBrand from "@/components/TinyTotsBrand";
import HeaderUtilities from "@/components/HeaderUtilities";

// NAVIGATION | CENTERED TINYTOTS BRAND | UTILITIES — Homepage only.
//
// Same space-budget constraint as InternalHeader: at 768px there isn't
// room for 5 nav links + the full brand+tagline + utilities in one row
// without the nav colliding with the brand (measured, not guessed — see
// InternalHeader.tsx for the same math). So the desktop cutover here is
// lg (1024px) too, falling back to hamburger + centered-brand below that,
// per "do not attempt to keep the full desktop navigation at widths
// where it no longer fits."
export default function HomepageHeader({
  mobileMenuOpen,
  onToggleMobileMenu,
  onSearchClick,
}: {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onSearchClick: () => void;
}) {
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
        <div className="hidden lg:flex items-center gap-4 lg:gap-5 flex-nowrap whitespace-nowrap">
          <Link
            href="/products?sort=newest"
            className="font-body-md text-body-md pb-1 transition-colors border-b-2 text-text-secondary hover:text-brand-primary border-transparent"
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
            className="font-body-md text-body-md pb-1 transition-colors border-b-2 text-text-secondary hover:text-brand-primary border-transparent"
          >
            Collections
          </Link>
          <Link
            href="/sale"
            className="font-body-md text-body-md pb-1 transition-colors border-b-2 text-text-secondary hover:text-brand-primary border-transparent"
          >
            Sale
          </Link>
        </div>
      </div>
      <TinyTotsBrand className="justify-self-center" />
      <HeaderUtilities onSearchClick={onSearchClick} />
    </nav>
  );
}
