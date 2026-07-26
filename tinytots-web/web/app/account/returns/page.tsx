"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

type ReturnItem = {
  id: number;
  type: string;
  message: string;
  status: string;
  photo_url: string | null;
  created_at: string;
  order: { id: number; order_number: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  open: "Submitted",
  in_progress: "Being reviewed",
  approved: "Approved",
  rejected: "Rejected",
  refunded: "Refunded",
  exchanged: "Exchanged",
  resolved: "Resolved",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-gray-100 text-gray-700",
  in_progress: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  refunded: "bg-green-100 text-green-800",
  exchanged: "bg-green-100 text-green-800",
  resolved: "bg-green-100 text-green-800",
};

export default function MyReturnsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/account/returns", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (res.ok) setItems(json.complaints || []);
      else setError(json.error || "Failed to load");
      setLoading(false);
    })();
  }, [user]);

  if (authLoading || loading) {
    return (
      <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <Link href="/account" className="text-sm font-medium text-primary hover:underline mb-4 inline-block">
        ← Back to account
      </Link>
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">My Returns & Reports</h1>

      {error && <p className="font-label-md text-label-md text-error mb-4">{error}</p>}

      {items.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          No returns or reports yet.{" "}
          <Link href="/report-issue" className="text-primary hover:underline">
            Report an issue
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((c) => (
            <div key={c.id} className="border border-outline-variant/30 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`inline-flex px-2 py-1 text-xs rounded-full font-semibold ${
                    STATUS_STYLES[c.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {STATUS_LABELS[c.status] || c.status}
                </span>
                <span className="text-xs text-on-surface-variant">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface mb-1">{c.message}</p>
              {c.order && (
                <p className="text-xs text-on-surface-variant font-mono">Order: {c.order.order_number}</p>
              )}
              {c.photo_url && (
                <img src={c.photo_url} alt="Attached photo" className="mt-2 w-24 h-24 object-cover rounded-lg" />
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}