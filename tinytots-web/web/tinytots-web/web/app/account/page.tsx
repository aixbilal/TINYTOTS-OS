"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

type Customer = {
  id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  orders_count: number;
};

type Order = {
  id: number;
  order_number: string;
  status: string;
  total: number;
  payment_method: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Order Placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  new: "text-primary",
  processing: "text-amber-600",
  shipped: "text-blue-600",
  delivered: "text-green-600",
  cancelled: "text-error",
};

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated (after auth state is known)
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
        .select("id, full_name, email, phone, orders_count")
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

      setDataLoading(false);
    }

    fetchAccountData();
  }, [user]);

  if (authLoading || (user && dataLoading)) {
    return (
      <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading your account...</p>
      </main>
    );
  }

  if (!user) return null; // redirect in progress

  return (
    <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">My Account</h1>

      {error && <p className="font-label-md text-label-md text-error mb-4">{error}</p>}

      {customer && (
        <section className="border border-outline-variant/30 rounded-xl p-6 mb-stack-md">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Profile</h2>
          <div className="flex flex-col gap-1 font-body-sm text-body-sm text-on-surface-variant">
            <p><span className="text-on-surface">Name:</span> {customer.full_name}</p>
            <p><span className="text-on-surface">Email:</span> {customer.email}</p>
            <p><span className="text-on-surface">Phone:</span> {customer.phone}</p>
            <p><span className="text-on-surface">Orders placed:</span> {customer.orders_count}</p>
            {customer.orders_count < 5 && (
              <p className="text-primary mt-1">
                🎉 {5 - customer.orders_count} more order{5 - customer.orders_count === 1 ? "" : "s"} until free delivery runs out!
              </p>
            )}
          </div>
          <button
            onClick={signOut}
            className="mt-4 font-body-sm text-body-sm text-error hover:underline"
          >
            Log out
          </button>
        </section>
      )}

      <section>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Order History</h2>
        {orders.length === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            No orders yet. <Link href="/products" className="text-primary hover:underline">Start shopping</Link>
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/order-confirmation/${order.order_number}`}
                className="border border-outline-variant/30 rounded-xl p-4 flex justify-between items-center hover:border-primary transition-colors"
              >
                <div>
                  <p className="font-body-md text-body-md text-on-surface">{order.order_number}</p>
                  <p className="font-label-md text-label-md text-on-surface-variant">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-body-sm text-body-sm ${STATUS_COLORS[order.status] ?? ""}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </p>
                  <p className="font-body-md text-body-md text-on-surface">Rs. {order.total.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}