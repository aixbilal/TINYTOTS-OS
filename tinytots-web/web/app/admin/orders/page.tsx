"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";

type Order = {
  id: number; order_number: string; guest_name: string | null; guest_phone: string | null;
  shipping_city: string; status: string; payment_method: string;
  cod_tier: string | null; cod_token_amount: number; cod_token_paid: boolean;
  total: number; created_at: string;
};

const STATUS_TABS = ["all", "new", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminFetch(`/api/admin/orders?status=${statusFilter}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) {
          setOrders([]);
          setError(json.error || "Failed to load orders.");
          return;
        }
        setOrders(json.data || []);
      })
      .catch(() => {
        setOrders([]);
        setError("Failed to load orders.");
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const statusColor: Record<string, string> = {
    new: "text-brand-primary",
    processing: "text-brand-primary",
    shipped: "text-brand-primary",
    delivered: "text-brand-primary",
    cancelled: "text-red-700",
  };

  return (
    <div>
      <h1 className="font-display-md text-display-md text-text-primary mb-stack-md">Orders</h1>

      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-1.5 rounded-full font-label-md text-label-md capitalize ${
              statusFilter === tab ? "bg-brand-primary text-white" : "bg-surface-secondary text-text-secondary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <p className="font-body-md text-body-md text-red-700 mb-4">{error}</p>
      )}

      {loading ? (
        <p className="font-body-md text-body-md text-text-secondary">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="font-body-md text-body-md text-text-secondary">
          {error ? "Could not load orders." : "No orders here."}
        </p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-border-default">
              <th className="py-2 font-label-md text-label-md text-text-secondary">Order #</th>
              <th className="py-2 font-label-md text-label-md text-text-secondary">Customer</th>
              <th className="py-2 font-label-md text-label-md text-text-secondary">City</th>
              <th className="py-2 font-label-md text-label-md text-text-secondary">Payment</th>
              <th className="py-2 font-label-md text-label-md text-text-secondary">COD Token</th>
              <th className="py-2 font-label-md text-label-md text-text-secondary">Total</th>
              <th className="py-2 font-label-md text-label-md text-text-secondary">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border-default">
                <td className="py-3 font-body-sm text-body-sm text-text-primary">{o.order_number}</td>
                <td className="py-3 font-body-sm text-body-sm text-text-secondary">{o.guest_name ?? "Account"} · {o.guest_phone ?? ""}</td>
                <td className="py-3 font-body-sm text-body-sm text-text-secondary">{o.shipping_city}</td>
                <td className="py-3 font-body-sm text-body-sm text-text-secondary capitalize">{o.payment_method}</td>
                <td className="py-3 font-body-sm text-body-sm">
                  {o.cod_tier && o.cod_tier !== "full_cod" ? (
                    <span className={o.cod_token_paid ? "text-brand-primary" : "text-red-700"}>
                      Rs. {o.cod_token_amount} {o.cod_token_paid ? "✓ paid" : "unpaid"}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 font-body-sm text-body-sm text-text-secondary">Rs. {o.total.toLocaleString()}</td>
                <td className={`py-3 font-label-md text-label-md capitalize ${statusColor[o.status] ?? ""}`}>{o.status}</td>
                <td className="py-3 text-right">
                  <Link href={`/admin/orders/${o.id}`} className="font-label-md text-label-md text-brand-primary hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}