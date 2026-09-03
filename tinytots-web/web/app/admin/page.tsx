"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { can, type AdminRole } from "@/lib/admin-permissions";
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

interface Counts {
  activeProducts: number;
  missingImageProducts: number;
  orders: number;
  newOrders: number;
  processingOrders: number;
  openComplaints: number;
  lowStockProducts: number;
  activeCategories: number;
  blogPosts: number;
  helpArticles: number;
}
interface RecentOrder {
  order_number: string;
  customer: string;
  status: string;
  total: number;
  created_at: string;
}

const QUICK_ACTIONS: { href: string; label: string; icon: string; perm?: Parameters<typeof can>[1] }[] = [
  { href: "/admin/products/new", label: "Add Product", icon: "add_box", perm: "canManageInventory" },
  { href: "/admin/orders", label: "View Orders", icon: "receipt_long", perm: "canManageOrders" },
  { href: "/admin/homepage", label: "Manage Homepage", icon: "home", perm: "canManageSettings" },
  { href: "/admin/reports", label: "Reports", icon: "bar_chart", perm: "canManageOrders" },
];

function Kpi({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const body = (
    <div className="rounded-lg border border-border-default bg-surface-elevated px-4 py-3">
      <p className="font-headline-lg text-[24px] font-semibold text-text-primary">{value}</p>
      <p className="mt-0.5 font-label-md text-label-md text-text-secondary">{label}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-colors hover:border-brand-primary/40">
      {body}
    </Link>
  ) : (
    body
  );
}

function ActionRow({
  icon,
  count,
  label,
  href,
  tone = "warning",
}: {
  icon: string;
  count: number;
  label: string;
  href: string;
  tone?: "warning" | "danger" | "info";
}) {
  const toneCls = {
    warning: "text-amber-700",
    danger: "text-red-700",
    info: "text-sky-700",
  }[tone];
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-md px-3 py-2.5 hover:bg-surface-secondary"
    >
      <span className="flex items-center gap-2.5 font-body-sm text-body-sm text-text-primary">
        <span className={`material-symbols-outlined text-[20px] ${toneCls}`} aria-hidden>
          {icon}
        </span>
        <span className="font-semibold">{count}</span> {label}
      </span>
      <span className="material-symbols-outlined text-[18px] text-text-secondary" aria-hidden>
        chevron_right
      </span>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { admin } = useAdminAuth();
  const role = admin?.role as AdminRole | undefined;
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch("/api/admin/dashboard");
        const data = await res.json();
        if (res.ok) {
          setCounts(data.counts);
          setRecent(data.recentOrders || []);
        }
      } catch {
        /* dashboard stats are a nice-to-have; a failed fetch leaves them hidden */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const showOrders = role && can(role, "canManageOrders");
  const showComplaints = role && can(role, "canHandleComplaints");
  const showInventory = role && can(role, "canManageInventory");

  const actions: { icon: string; count: number; label: string; href: string; tone: "warning" | "danger" | "info" }[] = [];
  if (counts) {
    if (showOrders && counts.newOrders > 0)
      actions.push({ icon: "fiber_new", count: counts.newOrders, label: "new orders to process", href: "/admin/orders?status=new", tone: "info" });
    if (showComplaints && counts.openComplaints > 0)
      actions.push({ icon: "support_agent", count: counts.openComplaints, label: "open complaints", href: "/admin/complaints", tone: "warning" });
    if (showInventory && counts.lowStockProducts > 0)
      actions.push({ icon: "inventory", count: counts.lowStockProducts, label: "products low on stock", href: "/admin/products", tone: "danger" });
    if (showInventory && counts.missingImageProducts > 0)
      actions.push({ icon: "image_not_supported", count: counts.missingImageProducts, label: "active products missing an image", href: "/admin/products", tone: "warning" });
  }

  const quick = QUICK_ACTIONS.filter((q) => !q.perm || (role && can(role, q.perm)));

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader
        title="Dashboard"
        description="What needs attention, and a snapshot of the store."
      />

      {/* KPI row */}
      {counts && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {showOrders && <Kpi label="New orders" value={counts.newOrders} href="/admin/orders?status=new" />}
          {showOrders && <Kpi label="Processing" value={counts.processingOrders} href="/admin/orders?status=processing" />}
          {showComplaints && <Kpi label="Open complaints" value={counts.openComplaints} href="/admin/complaints" />}
          {showInventory && <Kpi label="Low stock" value={counts.lowStockProducts} href="/admin/products" />}
          {showInventory && <Kpi label="Active products" value={counts.activeProducts} href="/admin/products" />}
          {showOrders && <Kpi label="Total orders" value={counts.orders} href="/admin/orders" />}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Action needed */}
        <AdminCard title="Action needed" className="lg:col-span-1" padded={false}>
          <div className="p-2">
            {!loaded ? (
              <p className="px-3 py-6 font-body-sm text-body-sm text-text-secondary">Loading…</p>
            ) : actions.length === 0 ? (
              <p className="px-3 py-6 font-body-sm text-body-sm text-text-secondary">
                Nothing needs attention right now.
              </p>
            ) : (
              actions.map((a, i) => <ActionRow key={i} {...a} />)
            )}
          </div>
        </AdminCard>

        {/* Recent orders */}
        <AdminCard
          title="Recent orders"
          className="lg:col-span-2"
          padded={false}
          actions={
            showOrders ? (
              <Link href="/admin/orders" className="font-body-sm text-body-sm text-brand-primary hover:underline">
                View all
              </Link>
            ) : undefined
          }
        >
          {!loaded ? (
            <p className="px-5 py-6 font-body-sm text-body-sm text-text-secondary">Loading…</p>
          ) : recent.length === 0 ? (
            <AdminEmptyState icon="receipt_long" title="No orders yet" />
          ) : (
            <AdminTableWrap className="rounded-none border-0">
              <thead>
                <tr>
                  <AdminTh>Order</AdminTh>
                  <AdminTh>Customer</AdminTh>
                  <AdminTh>Placed</AdminTh>
                  <AdminTh className="text-right">Total</AdminTh>
                  <AdminTh>Status</AdminTh>
                  <AdminTh />
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.order_number} className="hover:bg-surface-secondary/50">
                    <AdminTd className="font-medium">{o.order_number}</AdminTd>
                    <AdminTd>{o.customer}</AdminTd>
                    <AdminTd className="whitespace-nowrap text-text-secondary">{formatAdminDate(o.created_at)}</AdminTd>
                    <AdminTd className="whitespace-nowrap text-right tabular-nums">{formatPkr(o.total)}</AdminTd>
                    <AdminTd><AdminStatusBadge status={o.status} /></AdminTd>
                    <AdminTd className="text-right">
                      {showOrders && (
                        <Link
                          href={`/admin/orders`}
                          className="font-label-md text-label-md text-brand-primary hover:underline"
                        >
                          Open
                        </Link>
                      )}
                    </AdminTd>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminCard>
      </div>

      {/* Quick actions */}
      {quick.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 font-label-md text-[11px] font-semibold uppercase tracking-wider text-text-secondary/70">
            Quick actions
          </p>
          <div className="flex flex-wrap gap-2">
            {quick.map((q) => (
              <Link key={q.href} href={q.href}>
                <AdminButton variant="secondary" className="pointer-events-none">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden>{q.icon}</span>
                  {q.label}
                </AdminButton>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
