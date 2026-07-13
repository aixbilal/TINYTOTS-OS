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
      <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        <p className="text-on-surface-variant font-body-md text-body-md">
          Your cart is empty. Add something before checking out.
        </p>
        <Link href="/products" className="inline-block mt-4 text-primary hover:underline font-body-sm text-body-sm">
          Continue shopping
        </Link>
      </main>
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
          items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
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
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-outline-variant rounded-lg px-4 py-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary transition-colors";

  return (
    <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">Checkout</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-stack-md">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Contact details</h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Full name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className={inputClass}
              required
            />
            <input
              type="tel"
              placeholder="Phone number (e.g. 03001234567)"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Shipping address</h2>
          <div className="flex flex-col gap-3">
            <textarea
              placeholder="Full address (house/street/area)"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className={inputClass}
              rows={3}
              required
            />
            <input
              type="text"
              placeholder="City (e.g. Lahore, Islamabad, Karachi...)"
              value={shippingCity}
              onChange={(e) => setShippingCity(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Payment method</h2>
          <div className="flex flex-col gap-2">
            {[
              { value: "cod", label: "Cash on Delivery (Punjab & Islamabad only, for now)" },
              { value: "card", label: "Card" },
              { value: "jazzcash", label: "JazzCash" },
              { value: "easypaisa", label: "Easypaisa" },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                  paymentMethod === option.value
                    ? "border-primary bg-primary-container/10"
                    : "border-outline-variant"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="font-body-sm text-body-sm text-on-surface">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-3">
            Coupon code (optional)
          </h2>
          <input
            type="text"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="border-t border-outline-variant/30 pt-stack-sm">
          <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant mb-1">
            <span>Subtotal</span>
            <span>Rs. {subtotal.toLocaleString()}</span>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant">
            Delivery fee and any COD token amount will be confirmed after you place the order.
          </p>
        </div>

        {error && (
          <p className="font-body-sm text-body-sm text-error border border-error/30 bg-error-container/20 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-50"
        >
          {submitting ? "Placing order..." : "Place Order"}
        </button>
      </form>
    </main>
  );
}