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

const QUICK_LINKS = [
  { href: "/track-order", label: "Track Your Order", body: "Check real-time status", icon: "local_shipping" },
  { href: "/account/orders", label: "Order History", body: "View your past orders", icon: "receipt_long" },
  { href: "/account/wishlist", label: "Wishlist", body: "See your favorites", icon: "favorite" },
  { href: "/account/returns", label: "Returns & Exchanges", body: "Start a return", icon: "assignment_return" },
];

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
  const totalSpent = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const recentOrders = orders.slice(0, 3);

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

        {/* Quick Links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-bento-gap">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-surface-elevated rounded-2xl p-5 border border-border-subtle shadow-sm hover:border-brand-primary/40 transition-colors flex flex-col gap-2"
            >
              <span className="material-symbols-outlined text-brand-primary text-[24px]">{link.icon}</span>
              <span className="font-body-md text-body-md text-text-primary font-semibold">{link.label}</span>
              <span className="font-label-md text-label-md text-text-secondary">{link.body}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-bento-gap items-start">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-surface-elevated rounded-2xl p-6 border border-border-subtle shadow-sm min-w-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-headline-md text-headline-md text-text-primary">Recent Orders</h2>
              {orders.length > 0 && (
                <Link href="/account/orders" className="font-label-md text-label-md text-brand-primary hover:underline flex items-center gap-1">
                  View all orders <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <Link
                href="/products"
                className="flex items-center justify-center gap-2 bg-surface-secondary p-4 rounded-xl hover:bg-surface-tertiary transition-colors font-body-sm text-body-sm text-brand-primary"
              >
                Start shopping <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            ) : (
              <div className="flex flex-col gap-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.order_number}`}
                    className="flex items-center justify-between gap-3 border border-border-subtle rounded-xl p-4 hover:border-brand-primary/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-body-sm text-body-sm text-text-primary font-medium truncate">
                        Order #{order.order_number}
                      </p>
                      <p className="font-label-md text-label-md text-text-secondary mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full font-label-md text-label-md border whitespace-nowrap ${
                          STATUS_PILL[order.status] ?? "bg-surface-secondary text-text-secondary border-border-default"
                        }`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                      <p className="font-body-sm text-body-sm text-text-primary whitespace-nowrap">
                        Rs. {order.total.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Account Summary */}
          <div className="bg-surface-elevated rounded-2xl p-6 border border-border-subtle shadow-sm flex flex-col gap-4 min-w-0">
            <h2 className="font-headline-md text-headline-md text-text-primary">Account Summary</h2>
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm text-text-secondary">Total Orders</span>
              <span className="font-headline-md text-headline-md text-text-primary">{orders.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm text-text-secondary">Total Spent</span>
              <span className="font-headline-md text-headline-md text-text-primary">Rs. {totalSpent.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm text-text-secondary">Available Coupons</span>
              <span className="font-headline-md text-headline-md text-text-primary">{activeVouchers.length}</span>
            </div>
            <Link href="/account/addresses" className="font-label-md text-label-md text-brand-primary hover:underline mt-1">
              Manage profile & addresses →
            </Link>
            <button
              onClick={signOut}
              className="font-label-md text-label-md text-red-700 hover:underline text-left"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Vouchers */}
        <section id="vouchers" className="bg-surface-elevated rounded-2xl p-6 border border-border-subtle shadow-sm scroll-mt-28">
          <h2 className="font-headline-md text-headline-md text-text-primary mb-3">My Coupons</h2>
          {vouchers.length === 0 ? (
            <p className="font-body-sm text-body-sm text-text-secondary">No coupons yet.</p>
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
      </div>
    </main>
  );
}
