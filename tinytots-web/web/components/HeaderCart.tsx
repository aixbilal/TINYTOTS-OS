"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function HeaderCart() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={totalItems > 0 ? `Cart, ${totalItems} items` : "Cart"}
      className="relative shrink-0 text-text-secondary hover:text-brand-primary transition-colors hover:bg-surface-secondary p-2 rounded-full flex items-center justify-center"
    >
      <span className="material-symbols-outlined" aria-hidden>
        shopping_bag
      </span>
      {totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-full bg-brand-primary text-white">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}