"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import InternalTrustStrip from "@/components/InternalTrustStrip";
import { isValidPakPhone, PAK_PHONE_ERROR } from "@/lib/validate-phone";

const STATUS_STEPS = ["new", "processing", "shipped", "delivered"];

const STATUS_LABELS: Record<string, string> = {
  new: "Order received",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const inputClass =
  "w-full border border-border-default rounded-xl px-4 py-3 bg-surface-elevated font-body-md text-body-md text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary";

function TrackOrderForm() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(
    searchParams.get("order_number") ?? ""
  );
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOrder(null);

    if (!orderNumber.trim()) {
      setError("Please enter your order number.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter the phone number used at checkout.");
      return;
    }
    if (!isValidPakPhone(phone)) {
      setError(PAK_PHONE_ERROR);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/track-order?order_number=${encodeURIComponent(
          orderNumber
        )}&phone=${encodeURIComponent(phone)}`
      );
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Order not found.");
        setLoading(false);
        return;
      }
      setOrder(json.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <nav className="font-body-sm text-body-sm text-text-secondary mb-stack-sm flex items-center gap-2">
        <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-text-primary">Track Order</span>
      </nav>

      <h1 className="font-display-xl text-display-md text-text-primary mb-2">Track Your Order</h1>
      <p className="font-body-md text-body-md text-text-secondary mb-stack-md">
        Enter your order number and the phone number used at checkout to see its current status.
      </p>

      <div className="border border-border-default rounded-xl p-5 md:p-6 bg-surface-elevated">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="font-label-md text-label-md text-text-secondary mb-1 block">Order Number</label>
            <input
              type="text"
              placeholder="e.g. ORD-1234567890"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="font-label-md text-label-md text-text-secondary mb-1 block">Phone Number</label>
            <input
              type="tel"
              placeholder="Phone number used at checkout"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity disabled:opacity-50 mt-1"
          >
            {loading ? "Searching..." : "Track Order"}
          </button>
          <Link
            href="/products"
            className="text-center py-3 rounded-xl border border-border-default text-text-primary font-button text-button hover:border-brand-primary transition-colors"
          >
            Continue Shopping
          </Link>
        </form>
      </div>

      {error && (
        <p className="font-body-sm text-body-sm text-red-700 border border-red-700/30 bg-red-700/10 rounded-lg px-4 py-3 mb-stack-md">
          {error}
        </p>
      )}

      {order && (
        <div className="flex flex-col gap-stack-sm">
          <div className="border border-border-default rounded-xl p-5 bg-surface-elevated">
            <p className="font-body-sm text-body-sm text-text-secondary mb-1">
              Order {order.order_number}
            </p>
            <p className="font-headline-md text-headline-md text-text-primary mb-4">
              {STATUS_LABELS[order.status] ?? order.status}
            </p>

            {order.status !== "cancelled" ? (
              <div className="flex items-center">
                {STATUS_STEPS.map((step, idx) => {
                  const currentIdx = STATUS_STEPS.indexOf(order.status);
                  const reached = idx <= currentIdx;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div
                        className={`w-3 h-3 rounded-full ${reached ? "bg-brand-primary" : "bg-border-default"}`}
                      />
                      {idx < STATUS_STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 ${idx < currentIdx ? "bg-brand-primary" : "bg-border-default"}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-red-700">This order was cancelled.</p>
            )}
          </div>

          <div className="border border-border-default rounded-xl p-5 bg-surface-elevated">
            <h2 className="font-headline-md text-headline-md text-text-primary mb-3">Items</h2>
            <div className="flex flex-col gap-3">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="flex justify-between font-body-sm text-body-sm">
                  <div>
                    <p className="text-text-primary">{item.variants?.products?.name}</p>
                    <p className="text-text-secondary">
                      {item.variants?.size ?? "One Size"}
                      {item.variants?.color ? ` / ${item.variants.color}` : ""} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-text-primary">Rs. {item.line_total.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border-default mt-4 pt-4 flex justify-between font-semibold text-text-primary">
              <span>Total</span>
              <span>Rs. {order.total.toLocaleString()}</span>
            </div>
          </div>

          {order.payment_method === "cod" && !order.cod_token_paid && order.cod_token_amount > 0 && (
            <div className="border border-[#D9822B]/40 bg-[#D9822B]/10 rounded-xl p-4 font-body-sm text-body-sm text-[#8a5417]">
              A token payment of Rs. {order.cod_token_amount.toLocaleString()} is still required to confirm this order.
            </div>
          )}

          <div className="border border-border-default rounded-xl p-5 bg-surface-elevated font-body-sm text-body-sm">
            <h2 className="font-headline-md text-headline-md text-text-primary mb-2">Shipping to</h2>
            <p className="text-text-secondary">{order.shipping_address}, {order.shipping_city}</p>
          </div>
        </div>
      )}

      <p className="mt-stack-md font-body-sm text-body-sm text-text-secondary">
        Need help finding your order?{" "}
        <Link href="/help" className="text-brand-primary hover:underline">
          Visit our Help Center
        </Link>
      </p>
    </main>
    <div className="mt-stack-lg">
      <InternalTrustStrip />
    </div>
    </>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-6 py-12">Loading...</div>}>
      <TrackOrderForm />
    </Suspense>
  );
}