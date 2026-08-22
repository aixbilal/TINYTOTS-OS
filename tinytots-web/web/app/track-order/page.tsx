"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import InternalTrustStrip from "@/components/InternalTrustStrip";
import { isValidPakPhone, PAK_PHONE_ERROR } from "@/lib/validate-phone";
import type { StoreContact } from "@/lib/get-store-contact";

const HOW_IT_WORKS = [
  { icon: "assignment", title: "Enter Details", body: "Enter your order number and the phone number used at checkout." },
  { icon: "search", title: "Find Your Order", body: "We'll look up your order and fetch its latest status." },
  { icon: "local_shipping", title: "Track Progress", body: "See where your order stands right now." },
  { icon: "inventory_2", title: "Get It Delivered", body: "Your order arrives at your doorstep." },
];

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
  const [contact, setContact] = useState<StoreContact | null>(null);

  useEffect(() => {
    fetch("/api/store-contact")
      .then((res) => res.json())
      .then((json) => setContact(json.data))
      .catch(() => setContact(null));
  }, []);

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
    <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg">
      <nav className="font-body-sm text-body-sm text-text-secondary mb-stack-sm flex items-center gap-2">
        <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <Link href="/help" className="hover:text-brand-primary transition-colors">Help Center</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-text-primary">Track Order</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter items-center mb-stack-lg">
        <div>
          <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-2 block">
            Track Your Order
          </span>
          <h1 className="font-display-xl text-display-md text-text-primary tracking-tight mb-3">
            Track your order, every step of the way.
          </h1>
          <p className="font-body-md text-body-md text-text-secondary mb-stack-sm">
            Enter your order number and the phone number used at checkout to see its current status.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 border border-border-default rounded-2xl p-5 md:p-6 bg-surface-elevated shadow-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  placeholder="Phone used at checkout"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity disabled:opacity-50 mt-1"
            >
              {loading ? "Searching..." : "Track Order"}
            </button>
            <p className="font-label-md text-label-md text-text-secondary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-brand-primary">verified_user</span>
              Your information is safe and secure.
            </p>
          </form>
        </div>
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden">
          <Image
            src="/images/homepage/editorial-story-02.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 480px, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <section className="mb-stack-lg">
        <h2 className="font-headline-lg text-text-primary mb-stack-sm text-center">How Order Tracking Works</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-bento-gap">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="flex flex-col items-center text-center gap-2">
              <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-brand-primary/10 text-brand-primary">
                <span className="material-symbols-outlined text-[24px]">{step.icon}</span>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-primary text-white text-[11px] flex items-center justify-center font-semibold">
                  {i + 1}
                </span>
              </span>
              <p className="font-body-md text-body-md text-text-primary font-semibold">{step.title}</p>
              <p className="font-body-sm text-body-sm text-text-secondary">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className="max-w-2xl mx-auto font-body-sm text-body-sm text-red-700 border border-red-700/30 bg-red-700/10 rounded-lg px-4 py-3 mb-stack-md">
          {error}
        </p>
      )}

      {order && (
        <div className="max-w-2xl mx-auto flex flex-col gap-stack-sm mb-stack-lg">
          <div className="border border-border-default rounded-xl p-5 bg-surface-elevated">
            <p className="font-body-sm text-body-sm text-text-secondary mb-1">
              Order {order.order_number}
              {order.created_at &&
                ` · Placed ${new Date(order.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`}
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

      <section className="border border-border-default rounded-2xl overflow-hidden bg-surface-elevated grid grid-cols-1 lg:grid-cols-2">
        <div className="relative w-full aspect-[16/9] lg:aspect-auto order-2 lg:order-1">
          <Image
            src="/images/homepage/lifestyle-support.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 480px, 100vw"
            className="object-cover"
          />
        </div>
        <div className="p-8 flex flex-col justify-center gap-3 order-1 lg:order-2">
          <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">Need Help?</span>
          <p className="font-headline-md text-headline-md text-text-primary">We&apos;re here for you!</p>
          <p className="font-body-sm text-body-sm text-text-secondary">
            If you have any questions about your order, our customer care team is happy to help.
          </p>
          <div className="flex flex-col gap-2 mt-1 font-body-sm text-body-sm text-text-secondary">
            {contact?.whatsapp && (
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-primary text-[18px]">chat</span>
                WhatsApp: <span className="text-text-primary">{contact.whatsapp}</span>
              </p>
            )}
            {contact?.phone && (
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-primary text-[18px]">call</span>
                Call Us: <span className="text-text-primary">{contact.phone}</span>
              </p>
            )}
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-primary text-[18px]">mail</span>
              Email Us: <span className="text-text-primary">{contact?.email ?? "support@tinytotsofficial.com"}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link
              href="/help"
              className="bg-brand-primary text-white font-button text-button h-11 px-5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
            >
              Visit Help Center
            </Link>
            <Link
              href="/contact"
              className="border border-border-default text-text-primary font-button text-button h-11 px-5 rounded-xl hover:border-brand-primary transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              Contact Us
            </Link>
            <Link
              href="/products"
              className="border border-border-default text-text-primary font-button text-button h-11 px-5 rounded-xl hover:border-brand-primary transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    </main>
    <InternalTrustStrip />
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