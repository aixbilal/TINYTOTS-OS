"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function HeaderCart() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/cart"
      className="relative text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-low p-2 rounded-full flex items-center justify-center"
    >
      <span className="material-symbols-outlined">shopping_bag</span>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-full bg-primary text-on-primary">
          {totalItems}
        </span>
      )}
    </Link>
  );
}