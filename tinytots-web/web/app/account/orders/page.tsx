"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import AccountSidebar from "@/components/AccountSidebar";

type Order = {
  id: number;
  order_number: string;
  status: string;
  total: number;
  payment_method: string;
  created_at: string;
  order_items: { id: number; quantity: number }[];
};

const STATUS_LABELS: Record<string, string> = {
  new: "Order Placed",
  processing: "Processing",
  shipped: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_PILL: Record<string, string> = {
  new: "bg-surface-secondary text-text-secondary border-border-default",
  processing: "bg-brand-primary/10 text-brand-primary border-brand-primary/30",
  shipped: "bg-brand-primary/10 text-brand-primary border-brand-primary/30",
  delivered: "bg-green-700/10 text-green-700 border-green-700/30",
  cancelled: "bg-red-700/10 text-red-700 border-red-700/30",
};

const FILTERS = [
  { value: "all", label: "All Orders" },
  { value: "new", label: "Order Placed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrderHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: customer } = await supabase
        .from("customers")
        .select("id, full_name")
        .eq("auth_user_id", user!.id)
        .single();

      if (!customer) {
        setError("Couldn't load your account.");
        setLoading(false);
        return;
      }

      setCustomerName(customer.full_name);

      const { data, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, status, total, payment_method, created_at, order_items(id, quantity)")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        setError("Couldn't load your order history.");
      } else {
        setOrders((data as any) || []);
      }
      setLoading(false);
    }

    load();
  }, [user]);

  if (authLoading || (user && loading)) {
    return (
      <main className="max-w-container-max mx-auto py-stack-lg">
        <p className="font-body-md text-body-md text-text-secondary">Loading your orders...</p>
      </main>
    );
  }

  if (!user) return null;

  const totalOrders = orders.length;
  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalSpent / Math.max(1, orders.filter((o) => o.status !== "cancelled").length)) : 0;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <main className="max-w-container-max mx-auto w-full py-stack-lg flex flex-col md:flex-row gap-gutter">
      <AccountSidebar name={customerName} />

      <div className="flex-grow flex flex-col gap-stack-md w-full min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="font-display-md text-display-md text-text-primary mb-2">Order History</h1>
            <p className="font-body-md text-body-md text-text-secondary">
              View and track all your past orders in one place.
            </p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-border-default rounded-xl px-4 py-2.5 bg-surface-elevated font-body-sm text-body-sm text-text-primary focus:outline-none focus:border-brand-primary"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="font-label-md text-label-md text-red-700">{error}</p>}

        {totalOrders > 0 && (
          <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-sm p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="font-label-md text-label-md text-text-secondary uppercase tracking-wider mb-1">Total Orders</p>
              <p className="font-headline-lg text-headline-lg text-text-primary">{totalOrders}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-text-secondary uppercase tracking-wider mb-1">Total Spent</p>
              <p className="font-headline-lg text-headline-lg text-text-primary">Rs. {totalSpent.toLocaleString()}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-text-secondary uppercase tracking-wider mb-1">Average Order</p>
              <p className="font-headline-lg text-headline-lg text-text-primary">Rs. {avgOrderValue.toLocaleString()}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-text-secondary uppercase tracking-wider mb-1">Cancelled</p>
              <p className="font-headline-lg text-headline-lg text-text-primary">{cancelledCount}</p>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-sm p-10 flex flex-col items-center text-center gap-3">
            <span className="material-symbols-outlined text-brand-primary text-[40px]">local_shipping</span>
            <h2 className="font-headline-md text-headline-md text-text-primary">No orders yet</h2>
            <p className="font-body-sm text-body-sm text-text-secondary max-w-sm">
              When you place an order, it will show up here so you can track it anytime.
            </p>
            <Link
              href="/products"
              className="mt-2 bg-brand-primary text-white font-button text-button px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Start Shopping
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <p className="font-body-sm text-body-sm text-text-secondary">No orders match this filter.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((order) => {
              const itemCount = order.order_items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.order_number}`}
                  className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-brand-primary/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-body-md text-body-md text-text-primary font-semibold">
                        Order #{order.order_number}
                      </p>
                      <span
                        className={`px-3 py-1 rounded-full font-label-md text-label-md border ${
                          STATUS_PILL[order.status] ?? "bg-surface-secondary text-text-secondary border-border-default"
                        }`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                      {new Date(order.created_at).toLocaleDateString()} · {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
                      {order.payment_method === "cod" ? "Cash on Delivery" : order.payment_method}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <p className="font-headline-md text-headline-md text-text-primary">
                      Rs. {order.total.toLocaleString()}
                    </p>
                    <span className="flex items-center gap-1 font-button text-button text-brand-primary whitespace-nowrap">
                      View Details
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
