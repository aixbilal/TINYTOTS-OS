"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import AccountSidebar from "@/components/AccountSidebar";

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

const STATUS_PILL: Record<string, string> = {
  open: "bg-surface-container-high text-on-surface-variant border-outline/10",
  in_progress: "bg-primary-container/20 text-on-primary-container border-primary-container/30",
  approved: "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30",
  rejected: "bg-error-container/40 text-on-error-container border-error-container",
  refunded: "bg-tertiary-container/20 text-on-tertiary-container border-tertiary-container/30",
  exchanged: "bg-tertiary-container/20 text-on-tertiary-container border-tertiary-container/30",
  resolved: "bg-tertiary-container/20 text-on-tertiary-container border-tertiary-container/30",
};

export default function MyReturnsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("customers")
      .select("full_name")
      .eq("auth_user_id", user.id)
      .single()
      .then(({ data }) => setCustomerName(data?.full_name ?? null));

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
      <main className="max-w-container-max mx-auto py-stack-lg">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="max-w-container-max mx-auto w-full py-stack-lg flex flex-col md:flex-row gap-gutter">
      <AccountSidebar name={customerName} />

      <section className="flex-grow flex flex-col gap-stack-md min-w-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-display-md text-display-md text-on-surface">Returns & Refunds</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Track the status of every return, exchange, or issue you've reported.
            </p>
          </div>
          <Link
            href="/report-issue"
            className="bg-primary-container text-on-primary font-button text-button h-12 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
            <span className="material-symbols-outlined">add</span> Report an Issue
          </Link>
        </div>

        {error && <p className="font-label-md text-label-md text-error">{error}</p>}

        {items.length === 0 ? (
          <div className="border border-dashed border-outline-variant/40 rounded-2xl p-10 flex flex-col items-center text-center gap-3 bg-surface-container-lowest">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant">inventory_2</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              No returns or reports yet.
            </p>
            <Link href="/report-issue" className="font-body-sm text-body-sm text-primary hover:underline">
              Report an issue →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-bento-gap">
            {items.map((c) => (
              <div
                key={c.id}
                className="border border-outline-variant/20 rounded-2xl p-6 bg-surface-container-lowest flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <span
                    className={`px-3 py-1 rounded-full font-label-md text-label-md border ${
                      STATUS_PILL[c.status] ?? "bg-surface-container-high text-on-surface-variant border-outline/10"
                    }`}
                  >
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-body-sm text-body-md text-on-surface">{c.message}</p>
                {c.order && (
                  <p className="font-label-md text-label-md text-on-surface-variant font-mono">
                    Order: {c.order.order_number}
                  </p>
                )}
                {c.photo_url && (
                  <img
                    src={c.photo_url}
                    alt="Attached photo"
                    className="w-20 h-20 object-cover rounded-xl border border-outline-variant/20"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
