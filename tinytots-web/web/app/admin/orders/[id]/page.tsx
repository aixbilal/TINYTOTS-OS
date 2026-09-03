"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-fetch";
import { formatPkr, formatAdminDate } from "@/lib/admin-format";
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminStatusBadge,
  AdminTableWrap,
  AdminTh,
  AdminTd,
  AdminConfirmDialog,
} from "@/components/admin/ui";

type OrderItem = {
  id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
  variants: { id: number; color: string | null; size: string | null; products: { name: string; sku: string } };
};

type Order = {
  id: number;
  order_number: string;
  guest_name: string | null;
  guest_phone: string | null;
  shipping_address: string;
  shipping_city: string;
  status: string;
  payment_method: string;
  cod_tier: string | null;
  cod_token_amount: number;
  cod_token_paid: boolean;
  subtotal: number;
  delivery_fee: number;
  discount_total: number;
  total: number;
  coupon_code: string | null;
  created_at: string;
  customers: { full_name: string; phone: string; email: string } | null;
  items: OrderItem[];
};

const STATUS_OPTIONS = ["new", "processing", "shipped", "delivered", "cancelled"];

function paymentLabel(method: string) {
  const m = (method || "").toLowerCase();
  if (m === "cod") return "Cash on Delivery";
  if (m === "easypaisa") return "Easypaisa";
  if (m === "jazzcash") return "JazzCash";
  if (m === "card") return "Bank Card";
  return method || "—";
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState(false);

  useEffect(() => {
    setError(null);
    adminFetch(`/api/admin/orders/${id}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) {
          setOrder(null);
          setError(json.error || "Failed to load order.");
          return;
        }
        setOrder(json.data);
      })
      .catch(() => {
        setOrder(null);
        setError("Failed to load order.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function applyStatus(status: string) {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await adminFetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrder((prev) => (prev ? { ...prev, status } : prev));
        setFeedback({ tone: "success", text: `Status updated to “${status}”.` });
      } else {
        const j = await res.json().catch(() => ({}));
        setFeedback({ tone: "danger", text: j.error || "Couldn't update status. Please try again." });
      }
    } catch {
      setFeedback({ tone: "danger", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  function onStatusSelect(next: string) {
    if (!order || next === order.status || saving) return;
    if (next === "cancelled") {
      setPendingCancel(true);
      return;
    }
    applyStatus(next);
  }

  async function toggleCodTokenPaid() {
    if (!order) return;
    setSaving(true);
    setFeedback(null);
    const newValue = !order.cod_token_paid;
    try {
      const res = await adminFetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cod_token_paid: newValue }),
      });
      if (res.ok) {
        setOrder((prev) => (prev ? { ...prev, cod_token_paid: newValue } : prev));
        setFeedback({ tone: "success", text: `COD token marked ${newValue ? "paid" : "unpaid"}.` });
      } else {
        setFeedback({ tone: "danger", text: "Couldn't update the COD token." });
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="font-body-sm text-body-sm text-text-secondary">Loading order…</p>;
  if (!order) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/orders" className="font-label-md text-label-md text-brand-primary hover:underline">
          ← Back to orders
        </Link>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 font-body-sm text-body-sm text-red-800">
          {error || "Order not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/orders"
        className="mb-3 inline-flex items-center gap-1 font-label-md text-label-md text-brand-primary hover:underline"
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden>arrow_back</span> Orders
      </Link>

      <AdminPageHeader
        title={order.order_number}
        description={`Placed ${formatAdminDate(order.created_at)}`}
        actions={
          <div className="flex items-center gap-2">
            <AdminStatusBadge status={order.status} />
            <select
              value={order.status}
              onChange={(e) => onStatusSelect(e.target.value)}
              disabled={saving}
              aria-label="Change order status"
              className="rounded-md border border-border-default bg-surface-elevated px-3 py-2 font-body-sm text-body-sm capitalize focus:border-brand-primary focus:outline-none disabled:opacity-60"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {saving && (
        <p className="mb-3 font-label-md text-label-md text-text-secondary">Saving…</p>
      )}
      {feedback && (
        <p
          className={`mb-3 rounded-md border px-3 py-2 font-body-sm text-body-sm ${
            feedback.tone === "success"
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
          role="status"
        >
          {feedback.text}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AdminCard title="Customer">
          <p className="font-body-sm text-body-sm text-text-primary">
            {order.customers?.full_name ?? order.guest_name ?? "Guest"}
          </p>
          <p className="font-body-sm text-body-sm text-text-secondary">
            {order.customers?.phone ?? order.guest_phone ?? "—"}
          </p>
          <p className="font-body-sm text-body-sm text-text-secondary">
            {order.customers?.email ?? "Guest checkout"}
          </p>
        </AdminCard>
        <AdminCard title="Shipping">
          <p className="font-body-sm text-body-sm text-text-primary">{order.shipping_address}</p>
          <p className="font-body-sm text-body-sm text-text-secondary">{order.shipping_city}</p>
        </AdminCard>
      </div>

      <AdminCard title="Payment" className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body-sm text-body-sm text-text-primary">
            {paymentLabel(order.payment_method)}
            {order.coupon_code && (
              <span className="text-text-secondary"> · coupon {order.coupon_code}</span>
            )}
          </p>
          {order.cod_tier && order.cod_tier !== "full_cod" && order.cod_token_amount > 0 && (
            <div className="flex items-center gap-3">
              <span className="font-body-sm text-body-sm text-text-secondary">
                COD token {formatPkr(order.cod_token_amount)} ·{" "}
                <span className={order.cod_token_paid ? "text-green-700" : "text-red-700"}>
                  {order.cod_token_paid ? "paid" : "unpaid"}
                </span>
              </span>
              <AdminButton variant="secondary" onClick={toggleCodTokenPaid} disabled={saving}>
                {order.cod_token_paid ? "Mark unpaid" : "Mark paid"}
              </AdminButton>
            </div>
          )}
        </div>
      </AdminCard>

      <AdminCard title="Items" className="mt-4" padded={false}>
        <AdminTableWrap className="rounded-none border-0">
          <thead>
            <tr>
              <AdminTh>Product</AdminTh>
              <AdminTh>Variant</AdminTh>
              <AdminTh className="text-right">Qty</AdminTh>
              <AdminTh className="text-right">Unit price</AdminTh>
              <AdminTh className="text-right">Line total</AdminTh>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <AdminTd className="font-medium">{item.variants.products.name}</AdminTd>
                <AdminTd className="text-text-secondary">
                  {[item.variants.color, item.variants.size].filter(Boolean).join(" / ") || "—"}
                </AdminTd>
                <AdminTd className="text-right tabular-nums">{item.quantity}</AdminTd>
                <AdminTd className="text-right tabular-nums">{formatPkr(item.unit_price)}</AdminTd>
                <AdminTd className="text-right tabular-nums font-medium">{formatPkr(item.line_total)}</AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTableWrap>
        <div className="ml-auto max-w-xs space-y-1 p-4 font-body-sm text-body-sm text-text-secondary">
          <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{formatPkr(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span className="tabular-nums">{formatPkr(order.delivery_fee)}</span></div>
          {order.discount_total > 0 && (
            <div className="flex justify-between text-brand-primary">
              <span>Discount</span><span className="tabular-nums">− {formatPkr(order.discount_total)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border-default pt-1 font-headline-md text-headline-md font-semibold text-text-primary">
            <span>Total</span><span className="tabular-nums">{formatPkr(order.total)}</span>
          </div>
        </div>
      </AdminCard>

      {pendingCancel && (
        <AdminConfirmDialog
          title="Cancel this order?"
          message="Cancelling restores the reserved stock. This can't be undone from here."
          confirmLabel="Cancel order"
          cancelLabel="Keep order"
          danger
          busy={saving}
          onCancel={() => setPendingCancel(false)}
          onConfirm={async () => {
            setPendingCancel(false);
            await applyStatus("cancelled");
          }}
        />
      )}
    </div>
  );
}
