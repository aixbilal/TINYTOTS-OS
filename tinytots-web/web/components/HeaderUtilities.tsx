import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import HeaderCart from "@/components/HeaderCart";

// Search / Account / Wishlist / Cart — identical set and order on both the
// Homepage and Internal headers, so it lives in one place.
//
// Below md the centered wordmark + hamburger already claim the whole row, so
// the secondary utilities collapse into the hamburger menu (which already
// carries Search, Sign in / My Account and Wishlist) and only Cart stays
// pinned in the header — it's the primary storefront action and must never be
// clipped on a phone (FUNC-02):
//   • < md : Cart only.
//   • ≥ md : full Search + Account + Wishlist + Cart set — unchanged from before.
export default function HeaderUtilities({ onSearchClick }: { onSearchClick: () => void }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 md:gap-4 justify-end shrink-0">
      <button
        onClick={onSearchClick}
        className="hidden md:flex text-text-secondary hover:text-brand-primary transition-colors hover:bg-surface-secondary p-2 rounded-full items-center justify-center"
        title="Search"
        aria-label="Search"
      >
        <span className="material-symbols-outlined">search</span>
      </button>
      <div className="hidden md:flex items-center">
        <AccountMenu />
      </div>
      <Link
        href="/account/wishlist"
        className="hidden md:flex text-text-secondary hover:text-brand-primary transition-colors hover:bg-surface-secondary p-2 rounded-full items-center justify-center"
        title="Wishlist"
        aria-label="Wishlist"
      >
        <span className="material-symbols-outlined">favorite</span>
      </Link>
      {/* Cart last, always visible — never collapses into the menu. */}
      <HeaderCart />
    </div>
  );
}
