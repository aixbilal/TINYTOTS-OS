"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";

interface ComplaintDetail {
  id: number;
  order_id: number | null;
  customer_id: number | null;
  reporter_name: string | null;
  reporter_phone: string | null;
  type: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  customer: { id: number; full_name: string | null; phone: string; email: string | null; orders_count: number } | null;
  order: { id: number; order_number: string; total: number; status: string; created_at: string } | null;
}

interface OrderLite {
  id: number;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
}

interface ComplaintLite {
  id: number;
  type: string;
  status: string;
  message: string;
  created_at: string;
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

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [otherOrders, setOtherOrders] = useState<OrderLite[]>([]);
  const [otherComplaints, setOtherComplaints] = useState<ComplaintLite[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await adminFetch(`/api/admin/complaints/${id}`);
      const data = await res.json();
      if (res.ok) {
        setComplaint(data.complaint);
        setOtherOrders(data.otherOrders || []);
        setOtherComplaints(data.otherComplaints || []);
        setNotes(data.complaint.admin_notes || "");
      } else {
        setErrorMsg(data.error || "Failed to load complaint");
      }
    } catch (err) {
      console.error("Failed to load complaint", err);
      setErrorMsg("Failed to load complaint");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const updateStatus = async (status: ComplaintDetail["status"]) => {
    try {
      const res = await adminFetch(`/api/admin/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setComplaint((prev) => (prev ? { ...prev, ...data.complaint } : prev));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: notes }),
      });
      if (res.ok) {
        const data = await res.json();
        setComplaint((prev) => (prev ? { ...prev, ...data.complaint } : prev));
      }
    } catch (err) {
      console.error("Failed to save notes", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto text-center py-12 text-gray-500">Loading...</div>;
  }

  if (errorMsg || !complaint) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded mb-4">
          {errorMsg || "Complaint not found"}
        </div>
        <Link href="/admin/complaints" className="text-sm text-indigo-600 underline">
          ← Back to Complaints
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/admin/complaints" className="text-sm text-indigo-600 underline mb-4 inline-block">
        ← Back to Complaints
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="inline-flex px-2 py-1 text-xs rounded-full font-semibold bg-gray-100 text-gray-700 mr-2">
              {TYPE_LABELS[complaint.type] || complaint.type}
            </span>
            <span
              className={`inline-flex px-2 py-1 text-xs rounded-full font-semibold ${STATUS_STYLES[complaint.status]}`}
            >
              {complaint.status === "in_progress" ? "In Progress" : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(complaint.created_at).toLocaleString()}
          </span>
        </div>

        <p className="text-base text-gray-800 mb-4">{complaint.message}</p>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Reported by</p>
            <p>{complaint.customer?.full_name || complaint.reporter_name || "Guest"}</p>
            <p className="text-xs text-gray-500">
              {complaint.customer?.phone || complaint.reporter_phone || "No phone"}
            </p>
            {complaint.customer?.email && (
              <p className="text-xs text-gray-500">{complaint.customer.email}</p>
            )}
          </div>
          {complaint.order && (
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Related order</p>
              <p className="font-mono">{complaint.order.order_number}</p>
              <p className="text-xs text-gray-500">
                Rs. {complaint.order.total.toLocaleString()} · {complaint.order.status}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          {complaint.status !== "open" && (
            <button
              onClick={() => updateStatus("open")}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Mark Open
            </button>
          )}
          {complaint.status !== "in_progress" && (
            <button
              onClick={() => updateStatus("in_progress")}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200"
            >
              Mark In Progress
            </button>
          )}
          {complaint.status !== "resolved" && (
            <button
              onClick={() => updateStatus("resolved")}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-green-100 text-green-800 hover:bg-green-200"
            >
              Mark Resolved
            </button>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase mb-1 block">Internal notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add internal notes about how this was handled..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-2"
          />
          <button
            onClick={saveNotes}
            disabled={saving}
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Notes"}
          </button>
        </div>
      </div>

      {complaint.customer_id && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              This customer's other orders ({complaint.customer?.orders_count ?? 0} total)
            </h2>
            {otherOrders.length === 0 ? (
              <p className="text-xs text-gray-400">No other orders.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {otherOrders.map((o) => (
                  <div key={o.id} className="flex justify-between text-xs text-gray-600 border-b border-gray-100 pb-2 last:border-0">
                    <span className="font-mono">{o.order_number}</span>
                    <span>Rs. {o.total.toLocaleString()}</span>
                    <span className="capitalize">{o.status}</span>
                    <span>{new Date(o.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Other complaints from this customer</h2>
            {otherComplaints.length === 0 ? (
              <p className="text-xs text-gray-400">No other complaints.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {otherComplaints.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/complaints/${c.id}`}
                    className="flex justify-between text-xs text-gray-600 border-b border-gray-100 pb-2 last:border-0 hover:text-indigo-600"
                  >
                    <span>{TYPE_LABELS[c.type] || c.type}</span>
                    <span className="capitalize">{c.status}</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}