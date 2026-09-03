"use client";

import { useEffect, useState, useCallback } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { formatPkr } from "@/lib/admin-format";
import { AdminPageHeader, AdminCard, AdminTableWrap, AdminTh, AdminTd } from "@/components/admin/ui";

interface ReportData {
  sales: {
    revenue: number;
    orderCount: number;
    avgOrderValue: number;
    totalDiscountGiven: number;
    dailyBreakdown: { day: string; count: number; revenue: number }[];
  };
  coupons: {
    totalUses: number;
    totalDiscountGiven: number;
    breakdown: { code: string; uses: number; discountGiven: number }[];
  };
  vouchers: { issued: number; used: number; redeemedInOrders: number; bySource: Record<string, number> };
  referrals: { created: number; rewarded: number };
  products: {
    topSellers: { product_id: number; name: string; quantity: number; revenue: number; webMarkupProfit: number }[];
    totalWebMarkupProfit: number;
  };
}

type PresetRange = "today" | "week" | "month" | "custom";

function getPresetDates(preset: PresetRange): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  if (preset === "today") start.setHours(0, 0, 0, 0);
  else if (preset === "week") {
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-default bg-surface-elevated p-4">
      <p className="font-label-md text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{label}</p>
      <p className="mt-1 font-headline-lg text-[22px] font-semibold text-text-primary">{value}</p>
    </div>
  );
}

export default function AdminReportsPage() {
  const [preset, setPreset] = useState<PresetRange>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchReport = useCallback(async () => {
    let start: string, end: string;
    if (preset === "custom") {
      if (!customStart || !customEnd) return;
      start = new Date(customStart).toISOString();
      end = new Date(new Date(customEnd).setHours(23, 59, 59, 999)).toISOString();
    } else {
      const dates = getPresetDates(preset);
      start = dates.start;
      end = dates.end;
    }
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await adminFetch(`/api/admin/reports?start=${start}&end=${end}`);
      const json = await res.json();
      if (res.ok) setData(json);
      else setErrorMsg(json.error || "Failed to load report");
    } catch {
      setErrorMsg("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 font-label-md text-label-md font-medium transition-colors ${
      active
        ? "bg-brand-primary text-white"
        : "border border-border-default bg-surface-elevated text-text-secondary hover:bg-surface-secondary"
    }`;

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title="Reports" description="Sales, promotions and product performance. Cancelled orders are excluded." />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(["today", "week", "month"] as const).map((p) => (
          <button key={p} onClick={() => setPreset(p)} className={chip(preset === p)}>
            {p === "today" ? "Today" : p === "week" ? "Last 7 days" : "This month"}
          </button>
        ))}
        <button onClick={() => setPreset("custom")} className={chip(preset === "custom")}>
          Custom
        </button>
        {preset === "custom" && (
          <>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-md border border-border-default px-2 py-1.5 font-label-md text-label-md"
            />
            <span className="font-label-md text-label-md text-text-secondary">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-md border border-border-default px-2 py-1.5 font-label-md text-label-md"
            />
          </>
        )}
      </div>

      {errorMsg && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 font-body-sm text-body-sm text-red-800">{errorMsg}</p>
      )}

      {loading ? (
        <p className="py-12 text-center font-body-sm text-body-sm text-text-secondary">Loading report…</p>
      ) : data ? (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 font-headline-md text-headline-md font-semibold text-text-primary">Sales overview</h2>
            <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              <Stat label="Revenue" value={formatPkr(data.sales.revenue)} />
              <Stat label="Orders" value={String(data.sales.orderCount)} />
              <Stat label="Avg order value" value={formatPkr(Math.round(data.sales.avgOrderValue))} />
              <Stat label="Discounts given" value={formatPkr(data.sales.totalDiscountGiven)} />
              <Stat label="Web markup profit" value={formatPkr(data.products.totalWebMarkupProfit)} />
            </div>
            <p className="mb-3 font-label-md text-label-md text-text-secondary">
              Web Markup Profit is the extra margin from selling online above the in-store (POS) price, on top of
              normal cost-price profit.
            </p>
            {data.sales.dailyBreakdown.length > 0 && (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <AdminTh>Date</AdminTh>
                    <AdminTh className="text-right">Orders</AdminTh>
                    <AdminTh className="text-right">Revenue</AdminTh>
                  </tr>
                </thead>
                <tbody>
                  {data.sales.dailyBreakdown.map((d) => (
                    <tr key={d.day}>
                      <AdminTd>{d.day}</AdminTd>
                      <AdminTd className="text-right tabular-nums">{d.count}</AdminTd>
                      <AdminTd className="text-right tabular-nums">{formatPkr(d.revenue)}</AdminTd>
                    </tr>
                  ))}
                </tbody>
              </AdminTableWrap>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-headline-md text-headline-md font-semibold text-text-primary">Coupon performance</h2>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <Stat label="Total uses" value={String(data.coupons.totalUses)} />
              <Stat label="Discount given" value={formatPkr(data.coupons.totalDiscountGiven)} />
            </div>
            {data.coupons.breakdown.length > 0 ? (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <AdminTh>Code</AdminTh>
                    <AdminTh className="text-right">Uses</AdminTh>
                    <AdminTh className="text-right">Discount given</AdminTh>
                  </tr>
                </thead>
                <tbody>
                  {data.coupons.breakdown.map((c) => (
                    <tr key={c.code}>
                      <AdminTd className="font-mono font-semibold text-brand-primary">{c.code}</AdminTd>
                      <AdminTd className="text-right tabular-nums">{c.uses}</AdminTd>
                      <AdminTd className="text-right tabular-nums">{formatPkr(c.discountGiven)}</AdminTd>
                    </tr>
                  ))}
                </tbody>
              </AdminTableWrap>
            ) : (
              <p className="font-body-sm text-body-sm text-text-secondary">No coupons used in this period.</p>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-headline-md text-headline-md font-semibold text-text-primary">Vouchers &amp; referrals</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Vouchers issued" value={String(data.vouchers.issued)} />
              <Stat label="Vouchers used" value={String(data.vouchers.used)} />
              <Stat label="Referrals created" value={String(data.referrals.created)} />
              <Stat label="Referrals rewarded" value={String(data.referrals.rewarded)} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-headline-md text-headline-md font-semibold text-text-primary">Top selling products</h2>
            {data.products.topSellers.length > 0 ? (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <AdminTh>Product</AdminTh>
                    <AdminTh className="text-right">Units sold</AdminTh>
                    <AdminTh className="text-right">Revenue</AdminTh>
                  </tr>
                </thead>
                <tbody>
                  {data.products.topSellers.map((p) => (
                    <tr key={p.product_id}>
                      <AdminTd className="font-medium">{p.name}</AdminTd>
                      <AdminTd className="text-right tabular-nums">{p.quantity}</AdminTd>
                      <AdminTd className="text-right tabular-nums">{formatPkr(p.revenue)}</AdminTd>
                    </tr>
                  ))}
                </tbody>
              </AdminTableWrap>
            ) : (
              <AdminCard>
                <p className="font-body-sm text-body-sm text-text-secondary">No sales in this period.</p>
              </AdminCard>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
