"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/orders?status=${statusFilter}`)
      .then((r) => r.json())
      .then((json) => setOrders(json.data || []))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const statusColor: Record<string, string> = {
    new: "text-primary",
    processing: "text-primary",
    shipped: "text-primary",
    delivered: "text-primary",
    cancelled: "text-error",
  };

  return (
    <div>
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">Orders</h1>

      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-1.5 rounded-full font-label-md text-label-md capitalize ${
              statusFilter === tab ? "bg-primary-container text-on-primary" : "bg-surface-container-low text-on-surface-variant"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">No orders here.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-outline-variant/30">
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Order #</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Customer</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">City</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Payment</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">COD Token</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Total</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-outline-variant/10">
                <td className="py-3 font-body-sm text-body-sm text-on-surface">{o.order_number}</td>
                <td className="py-3 font-body-sm text-body-sm text-on-surface-variant">{o.guest_name ?? "Account"} · {o.guest_phone ?? ""}</td>
                <td className="py-3 font-body-sm text-body-sm text-on-surface-variant">{o.shipping_city}</td>
                <td className="py-3 font-body-sm text-body-sm text-on-surface-variant capitalize">{o.payment_method}</td>
                <td className="py-3 font-body-sm text-body-sm">
                  {o.cod_tier && o.cod_tier !== "full_cod" ? (
                    <span className={o.cod_token_paid ? "text-primary" : "text-error"}>
                      Rs. {o.cod_token_amount} {o.cod_token_paid ? "✓ paid" : "unpaid"}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 font-body-sm text-body-sm text-on-surface-variant">Rs. {o.total.toLocaleString()}</td>
                <td className={`py-3 font-label-md text-label-md capitalize ${statusColor[o.status] ?? ""}`}>{o.status}</td>
                <td className="py-3 text-right">
                  <Link href={`/admin/orders/${o.id}`} className="font-label-md text-label-md text-primary hover:underline">
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