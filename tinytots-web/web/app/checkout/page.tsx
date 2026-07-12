"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <main className="max-w-2xl mx-auto px-6 py-12">
          <p className="text-zinc-500">
            Your cart is empty. Add something before checking out.
          </p>
          <Link href="/" className="inline-block mt-4 text-sm underline text-black dark:text-white">
            Continue shopping
          </Link>
        </main>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!guestName || !guestPhone || !shippingAddress || !shippingCity) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            variant_id: i.variantId,
            quantity: i.quantity,
          })),
          shipping_address: shippingAddress,
          shipping_city: shippingCity,
          payment_method: paymentMethod,
          guest_name: guestName,
          guest_phone: guestPhone,
          coupon_code: couponCode || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      clearCart();
      router.push(`/order-confirmation/${json.data.order_number}`);
    } catch (err) {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-black dark:text-white mb-6">
          Checkout
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-black dark:text-white mb-3">
              Contact details
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white"
                required
              />
              <input
                type="tel"
                placeholder="Phone number (e.g. 03001234567)"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-black dark:text-white mb-3">
              Shipping address
            </h2>
            <div className="space-y-3">
              <textarea
                placeholder="Full address (house/street/area)"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white"
                rows={3}
                required
              />
              <input
                type="text"
                placeholder="City (e.g. Lahore, Islamabad, Karachi...)"
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                className="w-full border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-black dark:text-white mb-3">
              Payment method
            </h2>
            <div className="space-y-2">
              {[
                { value: "cod", label: "Cash on Delivery (Punjab & Islamabad only, for now)" },
                { value: "card", label: "Card" },
                { value: "jazzcash", label: "JazzCash" },
                { value: "easypaisa", label: "Easypaisa" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={option.value}
                    checked={paymentMethod === option.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="text-sm text-black dark:text-white">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-black dark:text-white mb-3">
              Coupon code (optional)
            </h2>
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-full border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white"
            />
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <div className="flex items-center justify-between text-sm text-zinc-500 mb-1">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-zinc-400">
              Delivery fee and any COD token amount will be confirmed after you place the order.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 border border-red-200 dark:border-red-900 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded bg-black text-white dark:bg-white dark:text-black font-medium disabled:opacity-50"
          >
            {submitting ? "Placing order..." : "Place Order"}
          </button>
        </form>
      </main>
    </div>
  );
}