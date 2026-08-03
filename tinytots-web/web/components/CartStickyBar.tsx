"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";

/**
 * Site-wide sticky bar after add-to-cart. Persists until dismissed or cart empties.
 * Hidden on cart/checkout where it's redundant.
 */
export default function CartStickyBar() {
  const { totalItems, total, cartBarVisible, dismissCartBar } = useCart();
  const pathname = usePathname();

  const hideOnRoute =
    pathname?.startsWith("/cart") ||
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/signage");

  if (!cartBarVisible || totalItems <= 0 || hideOnRoute) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[80] px-margin-mobile md:px-margin-desktop pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-container-max flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-label-md text-label-md text-on-surface-variant">
            {totalItems} {totalItems === 1 ? "item" : "items"} in cart
          </p>
          <p className="font-headline-md text-headline-md text-on-surface truncate">
            Rs. {total.toLocaleString()}
          </p>
        </div>
        <Link
          href="/cart"
          className="shrink-0 inline-flex items-center justify-center h-11 px-4 rounded-xl border border-outline-variant font-button text-button text-on-surface hover:bg-surface-container-low transition-colors"
        >
          View Cart
        </Link>
        <Link
          href="/checkout"
          className="shrink-0 inline-flex items-center justify-center h-11 px-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors"
        >
          Checkout
        </Link>
        <button
          type="button"
          onClick={dismissCartBar}
          aria-label="Dismiss cart bar"
          className="shrink-0 p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
    </div>
  );
}
