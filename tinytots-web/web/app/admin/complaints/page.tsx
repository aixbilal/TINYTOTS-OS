"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

interface Complaint {
  id: number;
  order_id: number | null;
  reporter_name: string | null;
  reporter_phone: string | null;
  type: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  resolved_at: string | null;
  created_at: string;
  customer: { id: number; full_name: string | null; phone: string } | null;
  order: { id: number; order_number: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  return: "Return",
  product_issue: "Product Issue",
  delivery_issue: "Delivery Issue",
  other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await adminFetch("/api/admin/complaints");
      const data = await res.json();
      if (res.ok) {
        setComplaints(data.complaints || []);
      } else {
        setErrorMsg(data.error || "Failed to load complaints");
      }
    } catch (err) {
      console.error("Failed to load complaints", err);
      setErrorMsg("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const updateStatus = async (id: number, status: Complaint["status"]) => {
    try {
      const res = await adminFetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints((prev) => prev.map((c) => (c.id === id ? data.complaint : c)));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const filtered =
    filter === "all" ? complaints : complaints.filter((c) => c.status === filter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
        <p className="text-sm text-gray-500">Customer complaints and issue reports</p>
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "open", "in_progress", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${
              filter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{errorMsg}</div>
      )}

{loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
          No complaints found.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/admin/complaints/${c.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:border-indigo-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="inline-flex px-2 py-1 text-xs rounded-full font-semibold bg-gray-100 text-gray-700 mr-2">
                    {TYPE_LABELS[c.type] || c.type}
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full font-semibold ${STATUS_STYLES[c.status]}`}
                  >
                    {c.status === "in_progress" ? "In Progress" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>

              <p className="text-sm text-gray-800 mb-3">{c.message}</p>

              <div className="text-xs text-gray-500 mb-3 space-y-0.5">
                <p>
                  From: {c.customer?.full_name || c.reporter_name || "Guest"}
                  {" · "}
                  {c.customer?.phone || c.reporter_phone || "No phone"}
                </p>
                {c.order && <p>Order: {c.order.order_number}</p>}
              </div>

              <div className="flex gap-2">
              {c.status !== "open" && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      updateStatus(c.id, "open");
                    }}
                    className="text-xs font-medium text-gray-600 hover:text-gray-900 underline"
                  >
                    Mark Open
                  </button>
                )}
        {c.status !== "in_progress" && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      updateStatus(c.id, "in_progress");
                    }}
                    className="text-xs font-medium text-amber-600 hover:text-amber-800 underline"
                  >
                    Mark In Progress
                  </button>
                )}
           {c.status !== "resolved" && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      updateStatus(c.id, "resolved");
                    }}
                    className="text-xs font-medium text-green-600 hover:text-green-800 underline"
                  >
                    Mark Resolved
                  </button>
                )}
        </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}