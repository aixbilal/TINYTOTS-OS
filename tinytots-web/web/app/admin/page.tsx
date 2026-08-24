"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { can, ROLE_PERMISSIONS, type AdminRole } from "@/lib/admin-permissions";

type Permission = keyof (typeof ROLE_PERMISSIONS)["admin"];

interface QuickLink {
  href: string;
  label: string;
  permission?: Permission;
}

interface Counts {
  activeProducts: number;
  missingImageProducts: number;
  orders: number;
  activeCategories: number;
  blogPosts: number;
  helpArticles: number;
}

const QUICK_ACTIONS: QuickLink[] = [
  { href: "/admin/products/new", label: "+ Add Product", permission: "canManageInventory" },
  { href: "/admin/orders", label: "Orders", permission: "canManageOrders" },
  { href: "/admin/categories", label: "Categories", permission: "canManageInventory" },
  { href: "/admin/homepage", label: "Homepage", permission: "canManageSettings" },
];

const CUSTOMER_WEBSITE_LINKS: QuickLink[] = [
  { href: "/admin/homepage", label: "Homepage", permission: "canManageSettings" },
  { href: "/admin/shop-content", label: "Shop", permission: "canManageSettings" },
  { href: "/admin/about-page", label: "About", permission: "canManagePages" },
  { href: "/admin/blog-content", label: "Blog Page Content", permission: "canManageBlog" },
  { href: "/admin/help-content", label: "Help Page Content", permission: "canManageHelp" },
  { href: "/admin/categories", label: "Collections", permission: "canManageInventory" },
  { href: "/admin/pages", label: "Site Pages", permission: "canManagePages" },
];

const CATALOG_LINKS: QuickLink[] = [
  { href: "/admin/products", label: "Products", permission: "canManageInventory" },
  { href: "/admin/categories", label: "Categories", permission: "canManageInventory" },
];

const OPERATIONS_LINKS: QuickLink[] = [
  { href: "/admin/orders", label: "Orders", permission: "canManageOrders" },
  { href: "/admin/discounts", label: "Discounts", permission: "canManageDiscounts" },
  { href: "/admin/coupons", label: "Coupons", permission: "canManageCoupons" },
  { href: "/admin/vouchers", label: "Vouchers", permission: "canManageReferrals" },
  { href: "/admin/complaints", label: "Complaints", permission: "canHandleComplaints" },
];

function filterAllowed(links: QuickLink[], role: AdminRole | undefined) {
  if (!role) return [];
  return links.filter((l) => !l.permission || can(role, l.permission));
}

function LinkGrid({ links }: { links: QuickLink[] }) {
  if (links.length === 0) {
    return <p className="text-sm text-gray-400">No modules available for your role.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-center transition-colors"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { admin } = useAdminAuth();
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch("/api/admin/dashboard");
        const data = await res.json();
        if (res.ok) setCounts(data.counts);
      } catch {
        // Counts are a nice-to-have; a failed fetch just leaves them hidden.
      }
    })();
  }, []);

  const role = admin?.role;

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <div>
        <h1 className="font-display-md text-display-md text-text-primary mb-1">Admin Dashboard</h1>
        <p className="font-body-md text-body-md text-text-secondary">
          Quick access to the tools you use most, plus a snapshot of the store.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <LinkGrid links={filterAllowed(QUICK_ACTIONS, role)} />
      </div>

      {counts && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">At a Glance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Active products" value={counts.activeProducts} />
            <StatCard label="Orders" value={counts.orders} />
            <StatCard label="Active collections" value={counts.activeCategories} />
            <StatCard label="Published blog posts" value={counts.blogPosts} />
            <StatCard label="Published help articles" value={counts.helpArticles} />
          </div>
          {counts.missingImageProducts > 0 && (
            <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              {counts.missingImageProducts} active product{counts.missingImageProducts === 1 ? "" : "s"} missing a
              product image —{" "}
              <Link href="/admin/products" className="underline font-medium">
                review in Products
              </Link>
              .
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer Website</h2>
          <LinkGrid links={filterAllowed(CUSTOMER_WEBSITE_LINKS, role)} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Catalog</h2>
          <LinkGrid links={filterAllowed(CATALOG_LINKS, role)} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Operations</h2>
          <LinkGrid links={filterAllowed(OPERATIONS_LINKS, role)} />
        </div>
      </div>
    </div>
  );
}
