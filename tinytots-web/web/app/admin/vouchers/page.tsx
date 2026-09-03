"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader, AdminAlert } from "@/components/admin/ui";

interface Voucher {
  id: number;
  customer_id: number;
  amount: number;
  is_used: boolean;
  source: string;
  expires_at: string;
  created_at: string;
  customer: { id: number; full_name: string | null; phone: string } | null;
}

const SOURCE_LABELS: Record<string, string> = {
  referral: "Referral",
  signup: "Signup",
  return_refund: "Return / Refund",
};

const SOURCE_STYLES: Record<string, string> = {
  referral: "bg-blue-100 text-blue-800",
  signup: "bg-purple-100 text-purple-800",
  return_refund: "bg-green-100 text-green-800",
};

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<"all" | "referral" | "signup" | "return_refund">("all");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await adminFetch("/api/admin/vouchers");
      const data = await res.json();
      if (res.ok) setVouchers(data.vouchers || []);
      else setErrorMsg(data.error || "Failed to load vouchers");
    } catch {
      setErrorMsg("Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const toggleUsed = async (id: number, is_used: boolean) => {
    const res = await adminFetch("/api/admin/vouchers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voucher_id: id, is_used }),
    });
    if (res.ok) {
      const data = await res.json();
      setVouchers((prev) => prev.map((v) => (v.id === id ? data.voucher : v)));
    }
  };

  const filtered = sourceFilter === "all" ? vouchers : vouchers.filter((v) => v.source === sourceFilter);
  const totalOutstanding = filtered.filter((v) => !v.is_used).reduce((sum, v) => sum + Number(v.amount), 0);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        breadcrumb={["Marketing", "Vouchers"]}
        title="Vouchers"
        description="All customer vouchers, across referral, signup, and return/refund sources."
      />

      {errorMsg && (
        <div className="mb-4">
          <AdminAlert tone="danger">{errorMsg}</AdminAlert>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "referral", "signup", "return_refund"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSourceFilter(f)}
              className={`rounded-md px-3 py-1.5 font-body-sm text-body-sm font-medium transition-colors ${
                sourceFilter === f
                  ? "bg-brand-primary text-white"
                  : "bg-surface-secondary text-text-secondary hover:text-text-primary"
              }`}
            >
              {f === "all" ? "All" : SOURCE_LABELS[f]}
            </button>
          ))}
        </div>
        <p className="font-body-sm text-body-sm text-text-secondary">
          Outstanding (unused):{" "}
          <span className="font-semibold text-text-primary">Rs. {totalOutstanding.toLocaleString()}</span>
        </p>
      </div>

      {loading ? (
        <p className="font-body-sm text-body-sm text-text-secondary">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-default">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{v.customer?.full_name || v.customer?.phone || "—"}</td>
                  <td className="px-4 py-3">Rs. {Number(v.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${SOURCE_STYLES[v.source] || "bg-gray-100 text-gray-700"}`}>
                      {SOURCE_LABELS[v.source] || v.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {v.is_used ? (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">Used</span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{new Date(v.expires_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{new Date(v.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleUsed(v.id, !v.is_used)}
                      className="text-xs font-medium text-brand-primary hover:underline"
                    >
                      Mark {v.is_used ? "unused" : "used"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    No vouchers for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
