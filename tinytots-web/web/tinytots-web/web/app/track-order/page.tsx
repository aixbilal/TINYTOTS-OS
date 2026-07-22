"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const STATUS_STEPS = ["new", "processing", "shipped", "delivered"];

const STATUS_LABELS: Record<string, string> = {
  new: "Order received",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const inputClass =
  "w-full border border-outline-variant/50 rounded-xl px-4 py-3 bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary";

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
    <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">Track Your Order</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-stack-md">
        <input
          type="text"
          placeholder="Order number (e.g. ORD-1234567890)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="tel"
          placeholder="Phone number used at checkout"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-50"
        >
          {loading ? "Searching..." : "Track Order"}
        </button>
      </form>

      {error && (
        <p className="font-body-sm text-body-sm text-error border border-error/30 bg-error-container/20 rounded-lg px-4 py-3 mb-stack-md">
          {error}
        </p>
      )}

      {order && (
        <div className="flex flex-col gap-stack-sm">
          <div className="border border-outline-variant/30 rounded-xl p-5 bg-surface-container-lowest">
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">
              Order {order.order_number}
            </p>
            <p className="font-headline-md text-headline-md text-on-surface mb-4">
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
                        className={`w-3 h-3 rounded-full ${reached ? "bg-primary" : "bg-outline-variant"}`}
                      />
                      {idx < STATUS_STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 ${idx < currentIdx ? "bg-primary" : "bg-outline-variant"}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-error">This order was cancelled.</p>
            )}
          </div>

          <div className="border border-outline-variant/30 rounded-xl p-5 bg-surface-container-lowest">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Items</h2>
            <div className="flex flex-col gap-3">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="flex justify-between font-body-sm text-body-sm">
                  <div>
                    <p className="text-on-surface">{item.variants?.products?.name}</p>
                    <p className="text-on-surface-variant">
                      {item.variants?.size ?? "One Size"}
                      {item.variants?.color ? ` / ${item.variants.color}` : ""} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-on-surface">Rs. {item.line_total.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-outline-variant/30 mt-4 pt-4 flex justify-between font-semibold text-on-surface">
              <span>Total</span>
              <span>Rs. {order.total.toLocaleString()}</span>
            </div>
          </div>

          {order.payment_method === "cod" && !order.cod_token_paid && order.cod_token_amount > 0 && (
            <div className="border border-[#D9822B]/40 bg-[#D9822B]/10 rounded-xl p-4 font-body-sm text-body-sm text-[#8a5417]">
              A token payment of Rs. {order.cod_token_amount.toLocaleString()} is still required to confirm this order.
            </div>
          )}

          <div className="border border-outline-variant/30 rounded-xl p-5 bg-surface-container-lowest font-body-sm text-body-sm">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Shipping to</h2>
            <p className="text-on-surface-variant">{order.shipping_address}, {order.shipping_city}</p>
          </div>
        </div>
      )}

      <Link href="/" className="inline-block mt-stack-md text-primary hover:underline font-body-sm text-body-sm">
        Continue shopping
      </Link>
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-6 py-12">Loading...</div>}>
      <TrackOrderForm />
    </Suspense>
  );
}