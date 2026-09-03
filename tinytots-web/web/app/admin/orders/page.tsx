"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-fetch";
import { formatPkr, formatAdminDate } from "@/lib/admin-format";
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminStatusBadge,
  AdminEmptyState,
  AdminTableWrap,
  AdminTh,
  AdminTd,
} from "@/components/admin/ui";

type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  guest_phone: string | null;
  shipping_city: string;
  status: string;
  payment_method: string;
  cod_tier: string | null;
  cod_token_amount: number;
  cod_token_paid: boolean;
  total: number;
  created_at: string;
};

const STATUS_TABS = ["all", "new", "processing", "shipped", "delivered", "cancelled"];

function paymentLabel(method: string) {
  const m = (method || "").toLowerCase();
  if (m === "cod") return "Cash on Delivery";
  if (m === "easypaisa") return "Easypaisa";
  if (m === "jazzcash") return "JazzCash";
  if (m === "card") return "Bank Card";
  return method || "—";
}

export default function AdminOrdersPage() {
  const params = useSearchParams();
  const initialStatus = params.get("status") || "all";

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(
    STATUS_TABS.includes(initialStatus) ? initialStatus : "all"
  );
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({
      status: statusFilter,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) qs.set("search", search);
    adminFetch(`/api/admin/orders?${qs.toString()}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) {
          setOrders([]);
          setError(json.error || "Failed to load orders.");
          return;
        }
        setOrders(json.data || []);
        setTotal(json.total || 0);
      })
      .catch(() => {
        setOrders([]);
        setError("Failed to load orders.");
      })
      .finally(() => setLoading(false));
  }, [statusFilter, search, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeLabel = useMemo(() => {
    if (total === 0) return "0 orders";
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return `${start}–${end} of ${total}`;
  }, [page, pageSize, total]);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title="Orders" description="Every customer and guest order, newest first." />

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-full px-3.5 py-1.5 font-label-md text-label-md font-medium capitalize transition-colors ${
                statusFilter === tab
                  ? "bg-brand-primary text-white"
                  : "border border-border-default bg-surface-elevated text-text-secondary hover:bg-surface-secondary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search order number, name or city…"
            className="w-full max-w-sm rounded-md border border-border-default bg-surface-elevated px-3 py-2 font-body-sm text-body-sm text-text-primary focus:border-brand-primary focus:outline-none"
          />
          <AdminButton type="submit" variant="secondary">Search</AdminButton>
          {search && (
            <AdminButton
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchInput("");
                setSearch("");
              }}
            >
              Clear
            </AdminButton>
          )}
        </form>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 font-body-sm text-body-sm text-red-800">
          {error}
        </p>
      )}

      <AdminCard padded={false}>
        {loading ? (
          <p className="px-5 py-10 text-center font-body-sm text-body-sm text-text-secondary">Loading orders…</p>
        ) : orders.length === 0 ? (
          <AdminEmptyState
            icon="receipt_long"
            title={search || statusFilter !== "all" ? "No matching orders" : "No orders yet"}
            description={search || statusFilter !== "all" ? "Try a different status or search term." : undefined}
          />
        ) : (
          <>
            <AdminTableWrap className="rounded-none border-0">
              <thead>
                <tr>
                  <AdminTh>Order</AdminTh>
                  <AdminTh>Customer</AdminTh>
                  <AdminTh>City</AdminTh>
                  <AdminTh>Placed</AdminTh>
                  <AdminTh>Payment</AdminTh>
                  <AdminTh className="text-right">Total</AdminTh>
                  <AdminTh>Status</AdminTh>
                  <AdminTh />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-secondary/50">
                    <AdminTd className="whitespace-nowrap font-medium">{o.order_number}</AdminTd>
                    <AdminTd className="max-w-[220px] truncate">{o.customer_name}</AdminTd>
                    <AdminTd className="whitespace-nowrap text-text-secondary">{o.shipping_city || "—"}</AdminTd>
                    <AdminTd className="whitespace-nowrap text-text-secondary">{formatAdminDate(o.created_at)}</AdminTd>
                    <AdminTd className="whitespace-nowrap text-text-secondary">
                      {paymentLabel(o.payment_method)}
                      {o.cod_tier && o.cod_tier !== "full_cod" && o.cod_token_amount > 0 && (
                        <span className={`ml-1 ${o.cod_token_paid ? "text-green-700" : "text-red-700"}`}>
                          · token {formatPkr(o.cod_token_amount)} {o.cod_token_paid ? "paid" : "unpaid"}
                        </span>
                      )}
                    </AdminTd>
                    <AdminTd className="whitespace-nowrap text-right tabular-nums font-medium">{formatPkr(o.total)}</AdminTd>
                    <AdminTd><AdminStatusBadge status={o.status} /></AdminTd>
                    <AdminTd className="whitespace-nowrap text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-label-md text-label-md font-medium text-brand-primary hover:underline"
                      >
                        View
                      </Link>
                    </AdminTd>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-3 border-t border-border-default px-4 py-3">
              <p className="font-label-md text-label-md text-text-secondary">{rangeLabel}</p>
              <div className="flex items-center gap-2">
                <AdminButton variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </AdminButton>
                <span className="font-label-md text-label-md text-text-secondary">
                  Page {page} / {totalPages}
                </span>
                <AdminButton
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </AdminButton>
              </div>
            </div>
          </>
        )}
      </AdminCard>
    </div>
  );
}
