"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import AccountSidebar from "@/components/AccountSidebar";

type Customer = {
  id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  orders_count: number;
  referral_code: string;
};

type Order = {
  id: number;
  order_number: string;
  status: string;
  total: number;
  payment_method: string;
  created_at: string;
};

type Voucher = {
  id: number;
  amount: number;
  is_used: boolean;
  expires_at: string;
  source: string;
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

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function fetchAccountData() {
      setDataLoading(true);
      setError(null);

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id, full_name, email, phone, orders_count, referral_code")
        .eq("auth_user_id", userId)
        .single();

      if (customerError) {
        setError("Couldn't load your account details.");
        setDataLoading(false);
        return;
      }

      setCustomer(customerData);

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, status, total, payment_method, created_at")
        .eq("customer_id", customerData.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        setError("Couldn't load your order history.");
      } else {
        setOrders(ordersData || []);
      }

      const { data: vouchersData } = await supabase
        .from("vouchers")
        .select("id, amount, is_used, expires_at, source")
        .eq("customer_id", customerData.id)
        .order("expires_at", { ascending: true });

      setVouchers(vouchersData || []);

      setDataLoading(false);
    }

    fetchAccountData();
  }, [user]);

  if (authLoading || (user && dataLoading)) {
    return (
      <main className="max-w-container-max mx-auto py-stack-lg">
        <p className="font-body-md text-body-md text-text-secondary">Loading your account...</p>
      </main>
    );
  }

  if (!user) return null;

  const firstName = customer?.full_name?.split(" ")[0] || "there";
  const activeVouchers = vouchers.filter(
    (v) => !v.is_used && new Date(v.expires_at) >= new Date()
  );
  const latestOrder = orders[0];

  return (
    <main className="max-w-container-max mx-auto w-full py-stack-lg flex flex-col md:flex-row gap-gutter">
      <AccountSidebar name={customer?.full_name} />

      <div className="flex-grow flex flex-col gap-stack-md w-full min-w-0">
        {/* Welcome Header */}
        <div className="bg-surface-elevated rounded-2xl p-8 border border-border-subtle shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-text-primary mb-2">
              Welcome back, {firstName}.
            </h1>
            <p className="font-body-md text-body-md text-text-secondary">
              Here is what is happening with your TinyTots account today.
            </p>
          </div>
          <div className="relative z-10 bg-surface-secondary rounded-xl p-4 flex items-center gap-4 border border-border-subtle min-w-[200px]">
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                redeem
              </span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-text-secondary uppercase tracking-wider mb-1">
                Rewards
              </p>
              <p className="font-headline-md text-body-lg md:text-headline-md text-text-primary font-semibold">
                {activeVouchers.length} Active <span className="text-brand-primary">Voucher{activeVouchers.length === 1 ? "" : "s"}</span>
              </p>
            </div>
          </div>
        </div>

        {error && <p className="font-label-md text-label-md text-red-700">{error}</p>}

        {/* Bento Row: Latest Order + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-bento-gap" id="orders">
          {/* Latest Order Card */}
          <div className="bg-surface-elevated rounded-2xl p-6 border border-border-subtle shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="font-headline-md text-headline-md text-text-primary mb-1">Latest Order</h2>
                <p className="font-body-sm text-body-sm text-text-secondary">
                  {latestOrder
                    ? `Order #${latestOrder.order_number} • Placed ${new Date(latestOrder.created_at).toLocaleDateString()}`
                    : "No orders yet"}
                </p>
              </div>
              {latestOrder && (
                <span
                  className={`px-3 py-1 rounded-full font-label-md text-label-md flex items-center gap-1 border ${
                    STATUS_PILL[latestOrder.status] ?? "bg-surface-secondary text-text-secondary border-border-default"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                  {STATUS_LABELS[latestOrder.status] ?? latestOrder.status}
                </span>
              )}
            </div>

            {latestOrder ? (
              <Link
                href={`/order-confirmation/${latestOrder.order_number}`}
                className="flex items-center gap-4 bg-surface-secondary p-4 rounded-xl hover:bg-surface-tertiary transition-colors"
              >
                <div className="w-16 h-16 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                  <span className="material-symbols-outlined text-[28px]">shopping_bag</span>
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-body-sm text-body-md text-text-primary font-medium truncate">
                    Rs. {latestOrder.total.toLocaleString()}
                  </p>
                  <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                    {latestOrder.payment_method}
                  </p>
                </div>
                <span className="bg-brand-primary text-white w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </span>
              </Link>
            ) : (
              <Link
                href="/products"
                className="flex items-center justify-center gap-2 bg-surface-secondary p-4 rounded-xl hover:bg-surface-tertiary transition-colors font-body-sm text-body-sm text-brand-primary"
              >
                Start shopping <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            )}
          </div>

          {/* Quick Links Card */}
          <div className="bg-surface-elevated rounded-2xl p-6 border border-border-subtle shadow-sm flex flex-col justify-between">
            <div className="mb-6">
              <h2 className="font-headline-md text-headline-md text-text-primary mb-1">Quick Actions</h2>
              <p className="font-body-sm text-body-sm text-text-secondary">Manage your recent activity.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/account/wishlist"
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border-subtle hover:border-brand-primary/50 hover:bg-surface-secondary transition-all group text-center h-28"
              >
                <span className="material-symbols-outlined text-text-secondary group-hover:text-brand-primary transition-colors text-[28px]">
                  favorite
                </span>
                <span className="font-body-sm text-body-sm text-text-primary font-medium">My Wishlist</span>
              </Link>
              <Link
                href="/track-order"
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border-subtle hover:border-brand-primary/50 hover:bg-surface-secondary transition-all group text-center h-28"
              >
                <span className="material-symbols-outlined text-text-secondary group-hover:text-brand-primary transition-colors text-[28px]">
                  inventory_2
                </span>
                <span className="font-body-sm text-body-sm text-text-primary font-medium">Track Shipment</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Profile */}
        {customer && (
          <section className="bg-surface-elevated rounded-2xl p-6 border border-border-subtle shadow-sm">
            <h2 className="font-headline-md text-headline-md text-text-primary mb-3">Profile</h2>
            <div className="flex flex-col gap-1 font-body-sm text-body-sm text-text-secondary">
              <p><span className="text-text-primary">Name:</span> {customer.full_name}</p>
              <p><span className="text-text-primary">Email:</span> {customer.email}</p>
              <p><span className="text-text-primary">Phone:</span> {customer.phone}</p>
              <p><span className="text-text-primary">Orders placed:</span> {customer.orders_count}</p>
              <p>
                <span className="text-text-primary">Your referral code:</span>{" "}
                <span className="font-mono font-semibold text-brand-primary">{customer.referral_code}</span>
              </p>
              <p className="font-label-md text-label-md text-text-secondary">
                Share this with friends — they enter it at checkout on their first order.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              <Link href="/account/addresses" className="font-body-sm text-body-sm text-brand-primary hover:underline">
                Manage saved addresses →
              </Link>
              <button
                onClick={signOut}
                className="font-body-sm text-body-sm text-red-700 hover:underline"
              >
                Log out
              </button>
            </div>
          </section>
        )}

        {/* Vouchers */}
        <section className="bg-surface-elevated rounded-2xl p-6 border border-border-subtle shadow-sm">
          <h2 className="font-headline-md text-headline-md text-text-primary mb-3">My Vouchers</h2>
          {vouchers.length === 0 ? (
            <p className="font-body-sm text-body-sm text-text-secondary">No vouchers yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {vouchers.map((v) => {
                const expired = new Date(v.expires_at) < new Date();
                const status = v.is_used ? "Used" : expired ? "Expired" : "Active";
                const statusColor =
                  status === "Active" ? "text-green-700" : "text-text-secondary";
                return (
                  <div
                    key={v.id}
                    className="border border-border-subtle rounded-xl px-4 py-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-body-md text-body-md text-text-primary">
                        Rs. {v.amount.toLocaleString()} off
                      </p>
                      <p className="font-label-md text-label-md text-text-secondary">
                        Expires {new Date(v.expires_at).toLocaleDateString()} · {v.source}
                      </p>
                    </div>
                    <span className={`font-label-md text-label-md ${statusColor}`}>{status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Order History */}
        <section className="bg-surface-elevated rounded-2xl p-6 border border-border-subtle shadow-sm">
          <h2 className="font-headline-md text-headline-md text-text-primary mb-3">Order History</h2>
          {orders.length === 0 ? (
            <p className="font-body-sm text-body-sm text-text-secondary">
              No orders yet. <Link href="/products" className="text-brand-primary hover:underline">Start shopping</Link>
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/order-confirmation/${order.order_number}`}
                  className="border border-border-subtle rounded-xl p-4 flex justify-between items-center hover:border-brand-primary transition-colors"
                >
                  <div>
                    <p className="font-body-md text-body-md text-text-primary">{order.order_number}</p>
                    <p className="font-label-md text-label-md text-text-secondary">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-body-sm text-body-sm text-text-secondary">
                      {STATUS_LABELS[order.status] ?? order.status}
                    </p>
                    <p className="font-body-md text-body-md text-text-primary">Rs. {order.total.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}