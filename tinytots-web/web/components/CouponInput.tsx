"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";

export default function CouponInput() {
  const { subtotal, appliedCoupon, applyCoupon, clearCoupon } = useCart();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), subtotal }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.error || "Invalid coupon code.");
        return;
      }

      applyCoupon({
        code: data.coupon.code,
        discountType: data.coupon.discount_type,
        value: data.coupon.value,
        discountAmount: data.coupon.discount_amount,
      });
      setCode("");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    clearCoupon();
    setError("");
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between border border-primary/40 rounded-xl px-4 py-3 bg-primary-container/10">
        <div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Coupon applied</p>
          <p className="font-headline-md text-headline-md text-primary">
            {appliedCoupon.code}
          </p>
        </div>
        <button
          onClick={handleRemove}
          className="text-error font-label-md text-label-md hover:underline"
        >
          Remove
        </button>
      </div>
    );
  }

  const canSubmit = !loading && code.trim().length > 0;

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (error) setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          placeholder="Enter coupon code"
          className={`flex-1 border rounded-lg px-3 py-2 bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none transition-colors ${
            error ? "border-error focus:border-error" : "border-outline-variant focus:border-primary"
          }`}
        />
        <button
          onClick={handleApply}
          disabled={!canSubmit}
          className={`px-5 py-2 rounded-lg font-button text-button transition-colors ${
            canSubmit
              ? "bg-primary-container text-on-primary hover:bg-primary cursor-pointer"
              : "bg-surface-container-low text-on-surface-variant cursor-not-allowed"
          }`}
        >
          {loading ? "Applying..." : "Apply"}
        </button>
      </div>
      {error && (
        <p className="mt-2 font-label-md text-label-md text-error">{error}</p>
      )}
    </div>
  );
}