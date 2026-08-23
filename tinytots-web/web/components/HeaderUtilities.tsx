import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import HeaderCart from "@/components/HeaderCart";

// Search / Account / Wishlist / Cart — identical set and order on both the
// Homepage and Internal headers, so it lives in one place.
export default function HeaderUtilities({ onSearchClick }: { onSearchClick: () => void }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 md:gap-4 justify-end shrink-0">
      <button
        onClick={onSearchClick}
        className="text-text-secondary hover:text-brand-primary transition-colors hover:bg-surface-secondary p-2 rounded-full flex items-center justify-center"
        title="Search"
        aria-label="Search"
      >
        <span className="material-symbols-outlined">search</span>
      </button>
      <AccountMenu />
      <Link
        href="/account/wishlist"
        className="text-text-secondary hover:text-brand-primary transition-colors hover:bg-surface-secondary p-2 rounded-full flex items-center justify-center"
        title="Wishlist"
        aria-label="Wishlist"
      >
        <span className="material-symbols-outlined">favorite</span>
      </Link>
      {/* Cart last so it isn't clipped off-screen on narrow phones */}
      <HeaderCart />
    </div>
  );
}
