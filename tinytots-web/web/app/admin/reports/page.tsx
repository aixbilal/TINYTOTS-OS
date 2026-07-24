"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminFetch } from "@/lib/admin-fetch";

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
  vouchers: {
    issued: number;
    used: number;
    redeemedInOrders: number;
    bySource: Record<string, number>;
  };
  referrals: {
    created: number;
    rewarded: number;
  };
  products: {
    topSellers: { product_id: number; name: string; quantity: number; revenue: number }[];
  };
  lowStock: { id: number; sku: string; stock: number; reorder_level: number; products: { name: string } }[];
}

type PresetRange = "today" | "week" | "month" | "custom";

function getPresetDates(preset: PresetRange): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start = new Date(now);
  if (preset === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (preset === "week") {
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return { start: start.toISOString(), end: end.toISOString() };
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
      if (res.ok) {
        setData(json);
      } else {
        setErrorMsg(json.error || "Failed to load report");
      }
    } catch (err) {
      console.error("Failed to load report", err);
      setErrorMsg("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const StatCard = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <p className="text-xs text-gray-400 uppercase mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Sales, promotions, and product performance</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(["today", "week", "month"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${
              preset === p ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p === "today" ? "Today" : p === "week" ? "Last 7 Days" : "This Month"}
          </button>
        ))}
        <button
          onClick={() => setPreset("custom")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium ${
            preset === "custom" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Custom
        </button>
        {preset === "custom" && (
          <>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-xs"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-xs"
            />
          </>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{errorMsg}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading report...</div>
      ) : data ? (
        <div className="flex flex-col gap-8">
          {/* Sales overview */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Sales Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <StatCard label="Revenue" value={`Rs. ${data.sales.revenue.toLocaleString()}`} />
              <StatCard label="Orders" value={data.sales.orderCount.toString()} />
              <StatCard label="Avg Order Value" value={`Rs. ${Math.round(data.sales.avgOrderValue).toLocaleString()}`} />
              <StatCard label="Discounts Given" value={`Rs. ${data.sales.totalDiscountGiven.toLocaleString()}`} />
            </div>
            {data.sales.dailyBreakdown.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Orders</th>
                      <th className="px-4 py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.sales.dailyBreakdown.map((d) => (
                      <tr key={d.day}>
                        <td className="px-4 py-2">{d.day}</td>
                        <td className="px-4 py-2">{d.count}</td>
                        <td className="px-4 py-2">Rs. {d.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Coupons */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Coupon Performance</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <StatCard label="Total Uses" value={data.coupons.totalUses.toString()} />
              <StatCard label="Discount Given" value={`Rs. ${data.coupons.totalDiscountGiven.toLocaleString()}`} />
            </div>
            {data.coupons.breakdown.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                    <tr>
                      <th className="px-4 py-2">Code</th>
                      <th className="px-4 py-2">Uses</th>
                      <th className="px-4 py-2">Discount Given</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.coupons.breakdown.map((c) => (
                      <tr key={c.code}>
                        <td className="px-4 py-2 font-mono font-bold text-indigo-600">{c.code}</td>
                        <td className="px-4 py-2">{c.uses}</td>
                        <td className="px-4 py-2">Rs. {c.discountGiven.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No coupons used in this period.</p>
            )}
          </section>

          {/* Vouchers & Referrals */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Vouchers & Referrals</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Vouchers Issued" value={data.vouchers.issued.toString()} />
              <StatCard label="Vouchers Used" value={data.vouchers.used.toString()} />
              <StatCard label="Referrals Created" value={data.referrals.created.toString()} />
              <StatCard label="Referrals Rewarded" value={data.referrals.rewarded.toString()} />
            </div>
          </section>

          {/* Top products */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Top Selling Products</h2>
            {data.products.topSellers.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                    <tr>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">Units Sold</th>
                      <th className="px-4 py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.products.topSellers.map((p) => (
                      <tr key={p.product_id}>
                        <td className="px-4 py-2">{p.name}</td>
                        <td className="px-4 py-2">{p.quantity}</td>
                        <td className="px-4 py-2">Rs. {p.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No sales in this period.</p>
            )}
          </section>

          {/* Low stock alert */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Low Stock Alert</h2>
            {data.lowStock.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                    <tr>
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">Stock</th>
                      <th className="px-4 py-2">Reorder Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.lowStock.map((v) => (
                      <tr key={v.id} className="text-red-600">
                        <td className="px-4 py-2 font-mono">{v.sku}</td>
                        <td className="px-4 py-2">{v.products?.name}</td>
                        <td className="px-4 py-2">{v.stock}</td>
                        <td className="px-4 py-2">{v.reorder_level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">All stock levels healthy.</p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}