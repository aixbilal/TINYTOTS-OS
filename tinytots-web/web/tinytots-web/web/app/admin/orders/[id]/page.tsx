"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type OrderItem = {
  id: number; quantity: number; unit_price: number; line_total: number;
  variants: { id: number; color: string | null; size: string | null; products: { name: string; sku: string } };
};

type Order = {
  id: number; order_number: string; guest_name: string | null; guest_phone: string | null;
  shipping_address: string; shipping_city: string; status: string; payment_method: string;
  cod_tier: string | null; cod_token_amount: number; cod_token_paid: boolean;
  subtotal: number; delivery_fee: number; discount_total: number; total: number;
  coupon_code: string | null; created_at: string;
  customers: { full_name: string; phone: string; email: string } | null;
  items: OrderItem[];
};

const STATUS_OPTIONS = ["new", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((json) => setOrder(json.data))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: string) {
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setOrder((prev) => (prev ? { ...prev, status } : prev));
    setSaving(false);
  }

  async function toggleCodTokenPaid() {
    if (!order) return;
    setSaving(true);
    const newValue = !order.cod_token_paid;
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cod_token_paid: newValue }),
    });
    if (res.ok) setOrder((prev) => (prev ? { ...prev, cod_token_paid: newValue } : prev));
    setSaving(false);
  }

  const inputClass =
    "border rounded-lg px-4 py-2 bg-surface-container-lowest text-on-surface font-body-md text-body-md border-outline-variant focus:border-primary focus:outline-none";

  if (loading) return <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>;
  if (!order) return <p className="font-body-md text-body-md text-error">Order not found.</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-stack-md">
        <h1 className="font-display-md text-display-md text-on-surface">{order.order_number}</h1>
        <select value={order.status} onChange={(e) => updateStatus(e.target.value)} disabled={saving} className={`${inputClass} capitalize`}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Customer</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {order.customers?.full_name ?? order.guest_name} <br />
            {order.customers?.phone ?? order.guest_phone} <br />
            {order.customers?.email ?? "Guest checkout"}
          </p>
        </div>
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Shipping</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {order.shipping_address} <br /> {order.shipping_city}
          </p>
        </div>
      </div>

      {order.cod_tier && order.cod_tier !== "full_cod" && (
        <div className="border border-outline-variant/30 rounded-lg p-4 mb-6 flex justify-between items-center">
          <p className="font-body-md text-body-md text-on-surface">
            COD Token Required: <strong>Rs. {order.cod_token_amount}</strong>
          </p>
          <button
            onClick={toggleCodTokenPaid}
            disabled={saving}
            className={`px-4 py-2 rounded-lg font-button text-button ${
              order.cod_token_paid ? "bg-surface-container-low text-on-surface-variant" : "bg-primary-container text-on-primary"
            }`}
          >
            {order.cod_token_paid ? "Mark as unpaid" : "Mark token as paid"}
          </button>
        </div>
      )}

      <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Items</h2>
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="text-left border-b border-outline-variant/30">
            <th className="py-2 font-label-md text-label-md text-on-surface-variant">Product</th>
            <th className="py-2 font-label-md text-label-md text-on-surface-variant">Variant</th>
            <th className="py-2 font-label-md text-label-md text-on-surface-variant">Qty</th>
            <th className="py-2 font-label-md text-label-md text-on-surface-variant">Unit Price</th>
            <th className="py-2 font-label-md text-label-md text-on-surface-variant">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-outline-variant/10">
              <td className="py-3 font-body-sm text-body-sm text-on-surface">{item.variants.products.name}</td>
              <td className="py-3 font-body-sm text-body-sm text-on-surface-variant">{item.variants.color} / {item.variants.size}</td>
              <td className="py-3 font-body-sm text-body-sm text-on-surface-variant">{item.quantity}</td>
              <td className="py-3 font-body-sm text-body-sm text-on-surface-variant">Rs. {item.unit_price}</td>
              <td className="py-3 font-body-sm text-body-sm text-on-surface-variant">Rs. {item.line_total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col items-end gap-1 font-body-sm text-body-sm text-on-surface-variant">
        <p>Subtotal: Rs. {order.subtotal}</p>
        <p>Delivery: Rs. {order.delivery_fee}</p>
        {order.discount_total > 0 && <p>Discount: -Rs. {order.discount_total}</p>}
        <p className="font-headline-md text-headline-md text-on-surface mt-1">Total: Rs. {order.total}</p>
      </div>
    </div>
  );
}