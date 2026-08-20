"use client";

import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import CouponInput from "@/components/CouponInput";
import OfflineNotice from "@/components/OfflineNotice";
import VoucherVault from "@/components/VoucherVault";
import Link from "next/link";
import InternalTrustStrip from "@/components/InternalTrustStrip";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, appliedCoupon, appliedVoucher, total } = useCart();

  if (items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto py-stack-lg text-center px-margin-mobile">
        <OfflineNotice feature="Cart and checkout" />
        <span className="material-symbols-outlined text-[48px] text-text-secondary">
          shopping_bag
        </span>
        <h1 className="font-display-xl text-display-md text-text-primary mt-4 mb-2">
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

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <OfflineNotice feature="Cart and checkout" />
      <h1 className="font-display-xl text-display-md text-text-primary">
        Your Cart ({itemCount})
      </h1>

      <p className="mt-4 mb-8 font-body-sm text-body-sm text-text-secondary max-w-xl">
        Free shipping across Pakistan. Remote areas may have a shipping fee depending on the area.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-md items-start">
        <div className="lg:col-span-2 min-w-0">
          <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto] gap-4 font-label-md text-label-md uppercase tracking-wide text-text-secondary pb-3 border-b border-border-default">
            <span>Product</span>
            <span className="w-24 text-right">Price</span>
            <span className="w-28 text-center">Quantity</span>
            <span className="w-24 text-right">Total</span>
          </div>

          <div className="flex flex-col divide-y divide-border-default">
            {items.map((item) => (
              <div key={item.variantId} className="flex gap-4 py-4">
                <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-surface-secondary">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-secondary">
                      <span className="material-symbols-outlined text-[24px]">image</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto] gap-2 lg:gap-4 items-center">
                  <div className="min-w-0">
                    <p className="font-headline-md text-headline-md text-text-primary break-words">
                      {item.productName}
                    </p>
                    {item.color && (
                      <p className="font-body-sm text-body-sm text-text-secondary mt-1">Color: {item.color}</p>
                    )}
                    {item.size && (
                      <p className="font-body-sm text-body-sm text-text-secondary">Size: {item.size}</p>
                    )}
                  </div>

                  <p className="lg:w-24 lg:text-right font-body-md text-body-md text-text-primary">
                    Rs. {item.price.toLocaleString()}
                  </p>

                  <div className="flex items-center gap-2 lg:w-28 lg:justify-center">
                    <div className="flex items-center border border-border-default rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-text-primary hover:bg-surface-secondary"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-text-primary font-body-md text-body-md tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                        className="w-8 h-8 flex items-center justify-center text-text-primary hover:bg-surface-secondary disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      aria-label="Remove item"
                      className="w-7 h-7 rounded-full border border-border-default flex items-center justify-center text-text-secondary hover:text-red-700 hover:border-red-700 transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>

                  <p className="lg:w-24 lg:text-right font-body-md text-body-md font-semibold text-text-primary tabular-nums">
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div className="min-w-0">
              <CouponInput />
            </div>
            <VoucherVault />
            <Link
              href="/products"
              className="inline-flex items-center gap-2 font-button text-button border border-border-default text-text-primary px-5 py-2.5 rounded-full hover:border-brand-primary transition-colors w-fit"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Continue Shopping
            </Link>
          </div>
        </div>

        <div
          className="lg:sticky lg:top-24 rounded-xl p-4 sm:p-6 flex flex-col gap-4 min-w-0"
          style={{
            background: "linear-gradient(160deg, rgba(97,104,69,0.08) 0%, rgba(97,104,69,0.02) 100%)",
            border: "1px solid rgba(97,104,69,0.15)",
          }}
        >
          <h2 className="font-label-lg text-label-lg uppercase tracking-wide text-text-primary">Order Summary</h2>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between gap-3 font-body-md text-body-md text-text-secondary">
              <span>Subtotal ({itemCount} items)</span>
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

            <div className="flex justify-between gap-3 font-body-md text-body-md text-text-secondary">
              <span>Shipping</span>
              <span className="shrink-0">Calculated at checkout</span>
            </div>

            <div className="flex justify-between items-baseline gap-3 pt-2 border-t border-brand-primary/15">
              <span className="font-label-lg text-label-lg uppercase tracking-wide text-text-primary whitespace-nowrap">Estimated Total</span>
              <span className="font-headline-lg text-headline-lg text-brand-primary tabular-nums shrink-0 whitespace-nowrap">Rs. {total.toLocaleString()}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            Proceed to Checkout
          </Link>

          <div className="rounded-lg bg-surface-elevated p-4 flex flex-col gap-1.5">
            <p className="font-label-md text-label-md text-text-primary mb-1">Why families love TinyTots</p>
            <p className="font-body-sm text-body-sm text-text-secondary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-brand-primary">check</span>
              Free shipping across Pakistan
            </p>
            <p className="font-body-sm text-body-sm text-text-secondary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-brand-primary">check</span>
              Easy 7-day returns
            </p>
            <p className="font-body-sm text-body-sm text-text-secondary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-brand-primary">check</span>
              Secure &amp; trusted payments
            </p>
          </div>
        </div>
      </div>
    </main>
    <InternalTrustStrip />
    </>
  );
}
