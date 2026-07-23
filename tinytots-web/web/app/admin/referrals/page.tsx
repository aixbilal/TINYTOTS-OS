"use client";

import React, { useEffect, useState } from "react";

interface CustomerLite {
  id: number;
  full_name: string | null;
  phone: string;
}

interface Referral {
  id: number;
  referral_code: string;
  reward_triggered: boolean;
  created_at: string;
  referrer: CustomerLite | null;
  referee: CustomerLite | null;
}

interface Voucher {
  id: number;
  customer_id: number;
  amount: number;
  is_used: boolean;
  source: string;
  expires_at: string;
  created_at: string;
  customer: CustomerLite | null;
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuingId, setIssuingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/referrals");
      const data = await res.json();
      if (res.ok) {
        setReferrals(data.referrals || []);
        setVouchers(data.vouchers || []);
      } else {
        setErrorMsg(data.error || "Failed to load referrals");
      }
    } catch (err) {
      console.error("Failed to load referrals", err);
      setErrorMsg("Failed to load referrals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssueReward = async (referralId: number) => {
    setIssuingId(referralId);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/referrals/issue-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_id: referralId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to issue reward");
      }
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIssuingId(null);
    }
  };

  const toggleVoucherUsed = async (voucherId: number, currentUsed: boolean) => {
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucher_id: voucherId, is_used: !currentUsed }),
      });
      if (res.ok) {
        setVouchers((prev) =>
          prev.map((v) => (v.id === voucherId ? { ...v, is_used: !currentUsed } : v))
        );
      }
    } catch (err) {
      console.error("Failed to update voucher", err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referrals & Vouchers</h1>
        <p className="text-sm text-gray-500">
          Track customer referrals and manage reward vouchers
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded">{errorMsg}</div>
      )}

      {/* Referrals table */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Referrals</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : referrals.length === 0 ? (
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
            No referrals yet.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Referrer</th>
                  <th className="px-6 py-3">Referee</th>
                  <th className="px-6 py-3">Reward</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                      {r.referral_code}
                    </td>
                    <td className="px-6 py-4">
                      {r.referrer?.full_name || r.referrer?.phone || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {r.referee
                        ? r.referee.full_name || r.referee.phone
                        : <span className="text-gray-400">Not yet redeemed</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full font-semibold ${
                          r.reward_triggered
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {r.reward_triggered ? "Issued" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!r.reward_triggered && r.referee ? (
                        <button
                          onClick={() => handleIssueReward(r.id)}
                          disabled={issuingId === r.id}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline disabled:opacity-50"
                        >
                          {issuingId === r.id ? "Issuing..." : "Issue Reward"}
                        </button>
                      ) : !r.referee ? (
                        <span className="text-xs text-gray-400">Awaiting referee</span>
                      ) : (
                        <span className="text-xs text-gray-400">Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Vouchers table */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Vouchers</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : vouchers.length === 0 ? (
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
            No vouchers issued yet.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Expires</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {v.customer?.full_name || v.customer?.phone || "—"}
                    </td>
                    <td className="px-6 py-4">${v.amount}</td>
                    <td className="px-6 py-4 capitalize">{v.source}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full font-semibold ${
                          v.is_used
                            ? "bg-gray-100 text-gray-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {v.is_used ? "Used" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(v.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleVoucherUsed(v.id, v.is_used)}
                        className="text-xs font-medium text-gray-600 hover:text-gray-900 underline"
                      >
                        {v.is_used ? "Mark unused" : "Void"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}