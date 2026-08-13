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
      className="fixed inset-x-0 bottom-0 z-[80] px-3 sm:px-margin-mobile md:px-margin-desktop pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-container-max flex flex-wrap items-center gap-2 sm:gap-3 rounded-2xl border border-border-default bg-surface-elevated shadow-[0_-8px_32px_rgba(0,0,0,0.12)] px-3 sm:px-4 py-3">
        <div className="min-w-0 flex-1 basis-[40%] sm:basis-auto">
          <p className="font-label-md text-label-md text-text-secondary whitespace-nowrap">
            {totalItems} {totalItems === 1 ? "item" : "items"} in cart
          </p>
          <p className="font-headline-md text-headline-md text-text-primary whitespace-nowrap tabular-nums">
            Rs. {total.toLocaleString()}
          </p>
        </div>
        <Link
          href="/cart"
          className="shrink-0 inline-flex items-center justify-center h-10 sm:h-11 px-3 sm:px-4 rounded-xl border border-border-default font-button text-button text-text-primary hover:bg-surface-secondary transition-colors"
        >
          View Cart
        </Link>
        <Link
          href="/checkout"
          className="shrink-0 inline-flex items-center justify-center h-10 sm:h-11 px-3 sm:px-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity"
        >
          Checkout
        </Link>
        <button
          type="button"
          onClick={dismissCartBar}
          aria-label="Dismiss cart bar"
          className="shrink-0 p-2 rounded-full text-text-secondary hover:bg-surface-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
    </div>
  );
}
