"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import AccountSidebar from "@/components/AccountSidebar";
import InternalTrustStrip from "@/components/InternalTrustStrip";

type OrderItem = {
  id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
  variants: {
    size: string | null;
    color: string | null;
    products: { name: string; image_url: string | null } | null;
  } | null;
};

type Order = {
  id: number;
  order_number: string;
  status: string;
  payment_method: string;
  shipping_address: string;
  shipping_city: string;
  subtotal: number;
  delivery_fee: number;
  discount_total: number;
  total: number;
  created_at: string;
  order_items: OrderItem[];
};

const STATUS_STEPS = ["new", "processing", "shipped", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  new: "Order Placed",
  processing: "Processing",
  shipped: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const STEP_LABELS = ["Order Placed", "Processing", "In Transit", "Delivered"];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ order_number: string }>();
  const { user, loading: authLoading } = useAuth();
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);

      const { data: customer } = await supabase
        .from("customers")
        .select("id, full_name")
        .eq("auth_user_id", user!.id)
        .single();

      if (!customer) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCustomerName(customer.full_name);

      // Ownership is enforced right here: the order must belong to THIS
      // customer_id, not just match the order_number. Any other customer's
      // order number returns zero rows, never another user's data.
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id, order_number, status, payment_method, shipping_address, shipping_city,
          subtotal, delivery_fee, discount_total, total, created_at,
          order_items ( id, quantity, unit_price, line_total,
            variants ( size, color, products ( name, image_url ) )
          )
        `
        )
        .eq("order_number", params.order_number)
        .eq("customer_id", customer.id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setOrder(data as any);
      }
      setLoading(false);
    }

    load();
  }, [user, params.order_number]);

  if (authLoading || (user && loading)) {
    return (
      <main className="max-w-container-max mx-auto py-stack-lg">
        <p className="font-body-md text-body-md text-text-secondary">Loading order...</p>
      </main>
    );
  }

  if (!user) return null;

  if (notFound || !order) {
    return (
      <main className="max-w-container-max mx-auto w-full py-stack-lg flex flex-col md:flex-row gap-gutter">
        <AccountSidebar name={customerName} />
        <div className="flex-grow flex flex-col items-center text-center gap-3 py-stack-lg">
          <span className="material-symbols-outlined text-brand-primary text-[40px]">search_off</span>
          <h1 className="font-headline-md text-headline-md text-text-primary">Order not found</h1>
          <p className="font-body-sm text-body-sm text-text-secondary max-w-sm">
            We couldn&apos;t find that order on your account. Double-check the order number, or view your full order history.
          </p>
          <Link href="/account/orders" className="mt-2 text-brand-primary hover:underline font-body-sm text-body-sm">
            ← Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <>
    <main className="max-w-container-max mx-auto w-full py-stack-lg flex flex-col md:flex-row gap-gutter">
      <AccountSidebar name={customerName} />

      <div className="flex-grow flex flex-col gap-stack-md w-full min-w-0">
        <Link
          href="/account/orders"
          className="font-body-sm text-body-sm text-brand-primary hover:underline flex items-center gap-1 w-fit"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Orders
        </Link>

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display-md text-display-md text-text-primary">Order #{order.order_number}</h1>
          <span
            className={`px-3 py-1 rounded-full font-label-md text-label-md border ${
              isCancelled
                ? "bg-red-700/10 text-red-700 border-red-700/30"
                : order.status === "delivered"
                  ? "bg-green-700/10 text-green-700 border-green-700/30"
                  : "bg-brand-primary/10 text-brand-primary border-brand-primary/30"
            }`}
          >
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-text-secondary -mt-2">
          Placed on {new Date(order.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-md items-start">
          <div className="lg:col-span-2 flex flex-col gap-stack-md min-w-0">
            {/* Status timeline - built only from the real status field, no fabricated timestamps */}
            <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-sm p-6">
              <h2 className="font-headline-md text-headline-md text-text-primary mb-6">Order Status</h2>
              {isCancelled ? (
                <p className="font-body-sm text-body-sm text-red-700">This order was cancelled.</p>
              ) : (
                <div className="flex items-center">
                  {STATUS_STEPS.map((step, idx) => {
                    const reached = idx <= currentIdx;
                    return (
                      <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                              reached
                                ? "bg-brand-primary border-brand-primary text-white"
                                : "bg-surface-secondary border-border-default text-text-secondary"
                            }`}
                          >
                            {reached ? (
                              <span className="material-symbols-outlined text-[18px]">check</span>
                            ) : (
                              <span className="text-[12px]">{idx + 1}</span>
                            )}
                          </div>
                          <span
                            className={`font-label-md text-label-md text-center w-16 ${
                              reached ? "text-text-primary font-semibold" : "text-text-secondary"
                            }`}
                          >
                            {STEP_LABELS[idx]}
                          </span>
                        </div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mb-6 ${idx < currentIdx ? "bg-brand-primary" : "bg-border-default"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-sm p-6">
              <h2 className="font-headline-md text-headline-md text-text-primary mb-4">
                Items ({order.order_items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
              <div className="flex flex-col divide-y divide-border-subtle">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-surface-secondary">
                      {item.variants?.products?.image_url ? (
                        <Image src={item.variants.products.image_url} alt="" fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-secondary">
                          <span className="material-symbols-outlined text-[20px]">image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body-md text-body-md text-text-primary font-medium">
                        {item.variants?.products?.name ?? "Product"}
                      </p>
                      <p className="font-body-sm text-body-sm text-text-secondary">
                        {item.variants?.color ?? ""}
                        {item.variants?.color && item.variants?.size ? " · " : ""}
                        {item.variants?.size ?? ""} · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="font-body-md text-body-md text-text-primary shrink-0">
                      Rs. {item.line_total.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-brand-primary/[0.04] border border-brand-primary/15 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-brand-primary text-[28px]">support_agent</span>
                <div>
                  <p className="font-headline-md text-headline-md text-text-primary">Need help with your order?</p>
                  <p className="font-body-sm text-body-sm text-text-secondary">We&apos;re here for you — reach out anytime.</p>
                </div>
              </div>
              <Link
                href="/contact"
                className="bg-brand-primary text-white font-button text-button px-6 py-3 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-stack-sm min-w-0">
            <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-sm p-6">
              <h2 className="font-headline-md text-headline-md text-text-primary mb-4">Order Summary</h2>
              <div className="flex flex-col gap-2 font-body-sm text-body-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal ({order.order_items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="shrink-0">Rs. {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Shipping</span>
                  <span className="shrink-0">{order.delivery_fee > 0 ? `Rs. ${order.delivery_fee.toLocaleString()}` : "Free"}</span>
                </div>
                {order.discount_total > 0 && (
                  <div className="flex justify-between text-brand-primary">
                    <span>Discount</span>
                    <span className="shrink-0">− Rs. {order.discount_total.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline gap-3 pt-3 mt-1 border-t border-border-default">
                  <span className="font-label-lg text-label-lg uppercase tracking-wide text-text-primary">Total</span>
                  <span className="font-headline-lg text-headline-lg text-brand-primary shrink-0">
                    Rs. {order.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary pt-2">
                  <span>Payment Method</span>
                  <span className="text-text-primary shrink-0">
                    {order.payment_method === "cod" ? "Cash on Delivery" : order.payment_method}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-sm p-6">
              <h2 className="font-headline-md text-headline-md text-text-primary mb-3">Shipping Address</h2>
              <p className="font-body-sm text-body-sm text-text-secondary">{order.shipping_address}</p>
              <p className="font-body-sm text-body-sm text-text-secondary">{order.shipping_city}, Pakistan</p>
            </div>

            {!isCancelled && (
              <Link
                href={`/track-order?order_number=${order.order_number}`}
                className="text-center border border-border-default rounded-xl py-3 font-button text-button text-text-primary hover:border-brand-primary transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                Track Your Order
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
    <InternalTrustStrip />
    </>
  );
}
