"use client";

import { useCart } from "@/lib/cart-context";
import Link from "next/link";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg text-center">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant">
          shopping_bag
        </span>
        <h1 className="font-display-md text-display-md text-on-surface mt-4 mb-2">
          Your Cart is Empty
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href="/products"
          className="inline-block py-3 px-8 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors"
        >
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">Your Cart</h1>

      <div className="flex flex-col gap-stack-sm">
        {items.map((item) => (
          <div
            key={item.variantId}
            className="flex items-center justify-between border border-outline-variant/30 rounded-xl p-4 bg-surface-container-lowest"
          >
            <div>
              <p className="font-headline-md text-headline-md text-on-surface">
                {item.productName}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {item.size ?? "One Size"}
                {item.color ? ` / ${item.color}` : ""}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Rs. {item.price.toLocaleString()} each
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center border border-outline-variant rounded-lg">
                <button
                  onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                  className="px-3 py-1 text-on-surface hover:bg-surface-container-low"
                >
                  −
                </button>
                <span className="px-3 text-on-surface font-body-md text-body-md">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                  disabled={item.quantity >= item.maxStock}
                  className="px-3 py-1 text-on-surface hover:bg-surface-container-low disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <p className="w-24 text-right font-body-md text-body-md font-semibold text-on-surface">
                Rs. {(item.price * item.quantity).toLocaleString()}
              </p>

              <button
                onClick={() => removeItem(item.variantId)}
                className="text-error font-label-md text-label-md hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-stack-md flex items-center justify-between border-t border-outline-variant/30 pt-stack-sm">
        <p className="font-headline-md text-headline-md text-on-surface">Subtotal</p>
        <p className="font-headline-lg text-headline-lg text-primary">
          Rs. {subtotal.toLocaleString()}
        </p>
      </div>

      <Link
        href="/checkout"
        className="mt-stack-sm block text-center w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors"
      >
        Proceed to Checkout
      </Link>
    </main>
  );
}