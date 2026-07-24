"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const MAX_LEN = { name: 80, phone: 20, address: 300, city: 50 };

function sanitize(v: string, max: number) {
  // strip control chars / trim, cap length — real escaping still happens server-side via parameterized Supabase calls
  return v.replace(/[<>]/g, "").slice(0, max);
}

function isValidPakPhone(phone: string) {
  const digits = phone.replace(/[\s-]/g, "");
  return /^(03\d{9}|\+923\d{9})$/.test(digits);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, total, appliedCoupon, appliedVoucher, clearCart } = useCart();
  const { user } = useAuth();

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [referralCode, setReferralCode] = useState("");
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [customerId, setCustomerId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("customers")
      .select("id, orders_count")
      .eq("auth_user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setCustomerId(data.id);
          setOrdersCount(data.orders_count);
        }
      });
}, [user]);

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

  function validate() {
    const errs: Record<string, string> = {};
    // Guest name/phone only required when NOT logged in
    if (!user) {
      if (!guestName.trim()) errs.guestName = "Please enter your full name.";
      if (!guestPhone.trim()) errs.guestPhone = "Please enter your phone number.";
      else if (!isValidPakPhone(guestPhone)) errs.guestPhone = "Enter a valid number, e.g. 03001234567.";
    }
    if (!shippingAddress.trim()) errs.shippingAddress = "Please enter your shipping address.";
    if (!shippingCity.trim()) errs.shippingCity = "Please enter your city.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
          shipping_address: shippingAddress.trim(),
          shipping_city: shippingCity.trim(),
          payment_method: paymentMethod,
          customer_id: user ? customerId : undefined,
          guest_name: user ? undefined : guestName.trim(),
          guest_phone: user ? undefined : guestPhone.trim(),
          coupon_code: appliedCoupon?.code,
          voucher_id: appliedVoucher?.id,
          referral_code: referralCode.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        // generic, non-descriptive message to the user — avoid leaking backend/query details
        setServerError(json.error && res.status < 500 ? json.error : "We couldn't place your order. Please check your details and try again.");
        setSubmitting(false);
        return;
      }

      clearCart();
      router.push(`/order-confirmation/${json.data.order_number}`);
    } catch {
      setServerError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full border rounded-lg px-4 py-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none transition-colors ${
      hasError ? "border-error focus:border-error" : "border-outline-variant focus:border-primary"
    }`;

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="font-label-md text-label-md text-error mt-1">{msg}</p> : null;

  return (
    <main className="max-w-5xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg grid grid-cols-1 md:grid-cols-3 gap-stack-md items-start">
      <div className="md:col-span-2">
        <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">Checkout</h1>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-stack-md">
        {!user && (
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Contact details</h2>
            <div className="flex flex-col gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Full name"
                  value={guestName}
                  onChange={(e) => setGuestName(sanitize(e.target.value, MAX_LEN.name))}
                  maxLength={MAX_LEN.name}
                  className={inputClass(!!fieldErrors.guestName)}
                />
                <FieldError msg={fieldErrors.guestName} />
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Phone number (e.g. 03001234567)"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(sanitize(e.target.value, MAX_LEN.phone))}
                  maxLength={MAX_LEN.phone}
                  className={inputClass(!!fieldErrors.guestPhone)}
                />
                <FieldError msg={fieldErrors.guestPhone} />
              </div>
            </div>
          </div>
  )}
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Shipping address</h2>
            <div className="flex flex-col gap-3">
              <div>
                <textarea
                  placeholder="Full address (house/street/area)"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(sanitize(e.target.value, MAX_LEN.address))}
                  maxLength={MAX_LEN.address}
                  rows={3}
                  className={inputClass(!!fieldErrors.shippingAddress)}
                />
                <FieldError msg={fieldErrors.shippingAddress} />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="City (e.g. Lahore, Islamabad, Karachi...)"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(sanitize(e.target.value, MAX_LEN.city))}
                  maxLength={MAX_LEN.city}
                  className={inputClass(!!fieldErrors.shippingCity)}
                />
                <FieldError msg={fieldErrors.shippingCity} />
              </div>
            </div>
          </div>

          {user && ordersCount === 0 && (
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-3">
                Referral code (optional)
              </h2>
              <input
                type="text"
                placeholder="Enter a friend's referral code"
                value={referralCode}
                onChange={(e) => setReferralCode(sanitize(e.target.value.toUpperCase(), 20))}
                maxLength={20}
                className={inputClass(false)}
              />
              <p className="font-label-md text-label-md text-on-surface-variant mt-1">
                First-time customers only — your friend gets a reward once this order is placed.
              </p>
            </div>
          )}

          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Payment method</h2>
            <div className="flex flex-col gap-2">
              {[
                { value: "cod", label: "Cash on Delivery (Punjab & Islamabad only, for now)" },
                { value: "card", label: "Card" },
                { value: "jazzcash", label: "JazzCash" },
                { value: "easypaisa", label: "Easypaisa" },
              ].map((option) => (
                <label key={option.value} className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                  paymentMethod === option.value ? "border-primary bg-primary-container/10" : "border-outline-variant"
                }`}>
                  <input type="radio" name="payment_method" value={option.value}
                    checked={paymentMethod === option.value}
                    onChange={(e) => setPaymentMethod(e.target.value)} />
                  <span className="font-body-sm text-body-sm text-on-surface">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-50"
            >
              {submitting ? "Placing order..." : "Place Order"}
            </button>
            <FieldError msg={serverError ?? undefined} />
          </div>
        </form>
      </div>

{/* Sticky order summary */}
<div className="md:sticky md:top-24 border border-outline-variant/30 rounded-xl p-6 bg-surface-container-lowest flex flex-col gap-3">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Order Summary</h2>

        {items.map((item) => (
          <div key={item.variantId} className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
            <span>
              {item.productName} × {item.quantity}
            </span>
            <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}

        <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/30">
          <div className="flex justify-between font-body-md text-body-md text-on-surface-variant">
            <span>Subtotal</span>
            <span>Rs. {subtotal.toLocaleString()}</span>
          </div>

          {appliedCoupon && (
            <div className="flex justify-between font-body-md text-body-md text-primary">
              <span>Discount ({appliedCoupon.code})</span>
              <span>− Rs. {appliedCoupon.discountAmount.toLocaleString()}</span>
            </div>
          )}

          {appliedVoucher && (
            <div className="flex justify-between font-body-md text-body-md text-primary">
              <span>Voucher</span>
              <span>− Rs. {appliedVoucher.amount.toLocaleString()}</span>
            </div>
          )}

          <p className="font-label-md text-label-md text-on-surface-variant">
            Delivery fee and any COD token amount will be confirmed after you place the order.
          </p>

          <div className="flex justify-between font-headline-lg text-headline-lg text-on-surface pt-2 border-t border-outline-variant/30">
            <span>Total</span>
            <span className="text-primary">Rs. {total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </main>
  );
}