"use client";

import { useCart } from "@/lib/cart-context";
import Link from "next/link";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <main className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-semibold text-black dark:text-white mb-4">
            Your Cart
          </h1>
          <p className="text-zinc-500">Your cart is empty.</p>
          <a
            href="/"
            className="inline-block mt-6 text-sm underline text-black dark:text-white"
          >
            Continue shopping
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-black dark:text-white mb-6">
          Your Cart
        </h1>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
            >
              <div>
                <p className="font-medium text-black dark:text-white">
                  {item.productName}
                </p>
                <p className="text-sm text-zinc-500">
                  {item.size ?? "One Size"}
                  {item.color ? ` / ${item.color}` : ""}
                </p>
                <p className="text-sm text-zinc-500">
                  Rs. {item.price.toLocaleString()} each
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded">
                  <button
                    onClick={() =>
                      updateQuantity(item.variantId, item.quantity - 1)
                    }
                    className="px-3 py-1 text-black dark:text-white"
                  >
                    −
                  </button>
                  <span className="px-3 text-black dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.variantId, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.maxStock}
                    className="px-3 py-1 text-black dark:text-white disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <p className="w-20 text-right font-medium text-black dark:text-white">
                  Rs. {(item.price * item.quantity).toLocaleString()}
                </p>

                <button
                  onClick={() => removeItem(item.variantId)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <p className="text-lg font-medium text-black dark:text-white">
            Subtotal
          </p>
          <p className="text-lg font-semibold text-black dark:text-white">
            Rs. {subtotal.toLocaleString()}
          </p>
        </div>

        <Link
            href="/checkout"
            className="mt-6 block text-center w-full py-3 rounded bg-black text-white dark:bg-white dark:text-black font-medium"
         >
           Proceed to Checkout
          </Link>
      </main>
    </div>
  );
}