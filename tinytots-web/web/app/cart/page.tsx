"use client";

import { useCart } from "@/lib/cart-context";
import CouponInput from "@/components/CouponInput";
import OfflineNotice from "@/components/OfflineNotice";
import VoucherVault from "@/components/VoucherVault";
import Link from "next/link";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, appliedCoupon, appliedVoucher, total } = useCart();

  if (items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto py-stack-lg text-center">
        <OfflineNotice feature="Cart and checkout" />
        <span className="material-symbols-outlined text-[48px] text-text-secondary">
          shopping_bag
        </span>
        <h1 className="font-display-md text-display-md text-text-primary mt-4 mb-2">
          Your Cart is Empty
        </h1>
        <p className="font-body-md text-body-md text-text-secondary mb-6">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href="/products"
          className="inline-block py-3 px-8 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity"
        >
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto py-stack-lg grid grid-cols-1 md:grid-cols-3 gap-stack-md items-start">
      <div className="md:col-span-2 min-w-0">
        <OfflineNotice feature="Cart and checkout" />
        <h1 className="font-display-md text-display-md text-text-primary mb-stack-md">Your Cart</h1>

        <div className="flex flex-col gap-stack-sm">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="flex flex-col gap-3 border border-border-default rounded-xl p-4 bg-surface-elevated min-w-0"
            >
              <div className="min-w-0">
                <p className="font-headline-md text-headline-md text-text-primary break-words">
                  {item.productName}
                </p>
                <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                  {item.size ?? "One Size"}
                  {item.color ? ` / ${item.color}` : ""}
                </p>
                <p className="font-body-sm text-body-sm text-text-secondary">
                  Rs. {item.price.toLocaleString()} each
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center border border-border-default rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    className="px-3 py-1 text-text-primary hover:bg-surface-secondary"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="px-3 text-text-primary font-body-md text-body-md tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxStock}
                    className="px-3 py-1 text-text-primary hover:bg-surface-secondary disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <p className="font-body-md text-body-md font-semibold text-text-primary tabular-nums">
                  Rs. {(item.price * item.quantity).toLocaleString()}
                </p>

                <button
                  onClick={() => removeItem(item.variantId)}
                  className="text-red-700 font-label-md text-label-md hover:underline shrink-0"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="md:sticky md:top-24 border border-border-default rounded-xl p-4 sm:p-6 bg-surface-elevated flex flex-col gap-4 min-w-0">
        <h2 className="font-headline-md text-headline-md text-text-primary">Order Summary</h2>

        <div className="min-w-0">
          <CouponInput />
        </div>

        <VoucherVault />

        <div className="flex flex-col gap-2 pt-3 border-t border-border-default">
          <div className="flex justify-between gap-3 font-body-md text-body-md text-text-secondary">
            <span>Subtotal</span>
            <span className="tabular-nums shrink-0">Rs. {subtotal.toLocaleString()}</span>
          </div>

          {appliedCoupon && (
            <div className="flex justify-between gap-3 font-body-md text-body-md text-brand-primary">
              <span className="min-w-0 truncate">Discount ({appliedCoupon.code})</span>
              <span className="tabular-nums shrink-0">− Rs. {appliedCoupon.discountAmount.toLocaleString()}</span>
            </div>
          )}

          {appliedVoucher && (
            <div className="flex justify-between gap-3 font-body-md text-body-md text-brand-primary">
              <span>Voucher</span>
              <span className="tabular-nums shrink-0">− Rs. {appliedVoucher.amount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between gap-3 font-headline-lg text-headline-lg text-text-primary pt-2 border-t border-border-default">
            <span>Total</span>
            <span className="text-brand-primary tabular-nums shrink-0">Rs. {total.toLocaleString()}</span>
          </div>
        </div>

        <Link
          href="/checkout"
          className="mt-2 block text-center w-full py-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity"
        >
          Proceed to Checkout
        </Link>
      </div>
    </main>
  );
}
