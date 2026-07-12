"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function HeaderCart() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/cart"
      className="relative text-sm font-medium text-black dark:text-white"
    >
      Cart
      {totalItems > 0 && (
        <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-black text-white dark:bg-white dark:text-black">
          {totalItems}
        </span>
      )}
    </Link>
  );
}