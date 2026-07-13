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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-black dark:text-white mb-6">
          Track Your Order
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3 mb-8">
          <input
            type="text"
            placeholder="Order number (e.g. ORD-1234567890)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white"
            required
          />
          <input
            type="tel"
            placeholder="Phone number used at checkout"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-zinc-900 text-black dark:text-white"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded bg-black text-white dark:bg-white dark:text-black font-medium disabled:opacity-50"
          >
            {loading ? "Searching..." : "Track Order"}
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-500 border border-red-200 dark:border-red-900 rounded px-3 py-2 mb-6">
            {error}
          </p>
        )}

        {order && (
          <div>
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 mb-6">
              <p className="text-sm text-zinc-500 mb-1">
                Order {order.order_number}
              </p>
              <p className="font-medium text-black dark:text-white mb-4">
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
                          className={`w-3 h-3 rounded-full ${
                            reached
                              ? "bg-black dark:bg-white"
                              : "bg-zinc-300 dark:bg-zinc-700"
                          }`}
                        />
                        {idx < STATUS_STEPS.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 ${
                              idx < currentIdx
                                ? "bg-black dark:bg-white"
                                : "bg-zinc-300 dark:bg-zinc-700"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-red-500">This order was cancelled.</p>
              )}
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 mb-6">
              <h2 className="font-medium text-black dark:text-white mb-3">
                Items
              </h2>
              <div className="space-y-3">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="text-black dark:text-white">
                        {item.variants?.products?.name}
                      </p>
                      <p className="text-zinc-500">
                        {item.variants?.size ?? "One Size"}
                        {item.variants?.color ? ` / ${item.variants.color}` : ""}
                        {" × "}
                        {item.quantity}
                      </p>
                    </div>
                    <p className="text-black dark:text-white">
                      Rs. {item.line_total.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-200 dark:border-zinc-800 mt-4 pt-4 flex justify-between font-semibold text-black dark:text-white">
                <span>Total</span>
                <span>Rs. {order.total.toLocaleString()}</span>
              </div>
            </div>

            {order.payment_method === "cod" && !order.cod_token_paid && order.cod_token_amount > 0 && (
              <div className="border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200 mb-6">
                A token payment of Rs. {order.cod_token_amount.toLocaleString()} is still required to confirm this order.
              </div>
            )}

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 text-sm">
              <h2 className="font-medium text-black dark:text-white mb-2">
                Shipping to
              </h2>
              <p className="text-zinc-500">
                {order.shipping_address}, {order.shipping_city}
              </p>
            </div>
          </div>
        )}

        <Link
          href="/"
          className="inline-block mt-6 text-sm underline text-black dark:text-white"
        >
          Continue shopping
        </Link>
      </main>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-6 py-12">Loading...</div>}>
      <TrackOrderForm />
    </Suspense>
  );
}