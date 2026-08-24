"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth-context";
import { can } from "@/lib/admin-permissions";
import { supabase } from "@/lib/supabase";

// Maps each admin route prefix to the permission required to view it.
// This is a client-side guard, not a substitute for the requireAdmin checks
// already on every API route — it exists so a team member who knows/guesses
// a URL they aren't linked to (e.g. typing /admin/team directly) sees a
// clear "not allowed" page instead of the real page shell rendering before
// its data fetches fail. Anything not listed here (e.g. /admin itself,
// /admin/account) is viewable by any active team member — the intended
// fallback for a general dashboard and the personal "my account" page.
const ROUTE_PERMISSIONS: { prefix: string; permission: Parameters<typeof can>[1] }[] = [
  { prefix: "/admin/products", permission: "canManageInventory" },
  { prefix: "/admin/categories", permission: "canManageInventory" },
  { prefix: "/admin/orders", permission: "canManageOrders" },
  { prefix: "/admin/reports", permission: "canManageOrders" },
  { prefix: "/admin/discounts", permission: "canManageDiscounts" },
  { prefix: "/admin/coupons", permission: "canManageCoupons" },
  { prefix: "/admin/referrals", permission: "canManageReferrals" },
  { prefix: "/admin/vouchers", permission: "canManageReferrals" },
  { prefix: "/admin/complaints", permission: "canHandleComplaints" },
  { prefix: "/admin/blog", permission: "canManageBlog" },
  { prefix: "/admin/blog-content", permission: "canManageBlog" },
  { prefix: "/admin/team", permission: "canManageTeam" },
  { prefix: "/admin/settings", permission: "canManageSettings" },
  { prefix: "/admin/homepage", permission: "canManageSettings" },
  { prefix: "/admin/campaigns", permission: "canManageSettings" },
  { prefix: "/admin/site-content", permission: "canManageSettings" },
  { prefix: "/admin/testimonials", permission: "canManageSettings" },
  { prefix: "/admin/ugc-posts", permission: "canManageSettings" },
  { prefix: "/admin/shipping-cities", permission: "canManageSettings" },
  { prefix: "/admin/help", permission: "canManageHelp" },
  { prefix: "/admin/pages", permission: "canManagePages" },
  { prefix: "/admin/about-page", permission: "canManagePages" },
  { prefix: "/admin/shipping-returns", permission: "canManagePages" },
];

function getRequiredPermission(pathname: string) {
  const match = ROUTE_PERMISSIONS.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  return match?.permission;
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, loading, signOut } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !admin && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [loading, admin, isLoginPage, router]);

  // Opt-in MFA: if this admin has verified factors, block the panel until aal2.
  // Never force enrollment — only enforce the challenge after they opted in.
  useEffect(() => {
    if (loading || isLoginPage || !admin) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (cancelled) return;
      if (data?.nextLevel === "aal2" && data.currentLevel !== "aal2") {
        await signOut();
        router.replace("/admin/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, admin, isLoginPage, router, signOut]);

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <main className="p-8 font-body-md text-body-md text-text-secondary">
        Checking admin access...
      </main>
    );
  }

  if (!admin) {
    // Redirect effect above will fire; render nothing meanwhile
    return null;
  }

  const requiredPermission = getRequiredPermission(pathname || "");
  const accessDenied = requiredPermission && !can(admin.role, requiredPermission);

  const navItem = (href: string, label: string) => {
    const active = pathname === href || (href !== "/admin" && pathname?.startsWith(href));
    return (
      <Link
        href={href}
        onClick={() => setSidebarOpen(false)}
        className={`block px-4 py-2 rounded-lg font-body-sm text-body-sm ${
          active
            ? "bg-brand-primary text-white"
            : "text-text-secondary hover:bg-surface-secondary"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar with hamburger trigger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border-default bg-surface-elevated">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open admin menu"
          className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary"
        >
          <span className="material-symbols-outlined text-[24px] text-text-primary">menu</span>
        </button>
        <span className="font-display-sm text-display-sm text-brand-primary">TinyTots Admin</span>
        <div className="w-8" />
      </div>

      {/* Backdrop, mobile only, while drawer is open */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`w-64 shrink-0 border-r border-border-default bg-surface-elevated p-4 flex flex-col gap-1 overflow-y-auto
          fixed inset-y-0 left-0 z-50 transition-transform duration-200
          md:static md:translate-x-0 md:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="font-display-sm text-display-sm text-brand-primary">TinyTots Admin</span>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close admin menu"
            className="md:hidden p-1 rounded-lg hover:bg-surface-secondary"
          >
            <span className="material-symbols-outlined text-[22px] text-text-secondary">close</span>
          </button>
        </div>
        {navItem("/admin", "Dashboard")}
        {can(admin.role, "canManageInventory") && navItem("/admin/products", "Products")}
        {can(admin.role, "canManageInventory") && navItem("/admin/categories", "Categories")}
        {can(admin.role, "canManageOrders") && navItem("/admin/orders", "Orders")}
        {can(admin.role, "canManageOrders") && navItem("/admin/reports", "Reports")}
        {can(admin.role, "canManageDiscounts") && navItem("/admin/discounts", "Discounts")}
        {can(admin.role, "canManageCoupons") && navItem("/admin/coupons", "Coupons")}
        {can(admin.role, "canManageReferrals") && navItem("/admin/referrals", "Referrals")}
        {can(admin.role, "canManageReferrals") && navItem("/admin/vouchers", "Vouchers")}
        {can(admin.role, "canHandleComplaints") && navItem("/admin/complaints", "Complaints")}
        {can(admin.role, "canManageBlog") && navItem("/admin/blog", "Blog")}
        {can(admin.role, "canManageBlog") && navItem("/admin/blog-content", "Blog Page Content")}
        {navItem("/admin/account", "My Account")}
        {can(admin.role, "canManageTeam") && navItem("/admin/team", "Team")}
        {can(admin.role, "canManageSettings") && navItem("/admin/homepage", "Homepage")}
        {can(admin.role, "canManageSettings") && navItem("/admin/campaigns", "Campaigns")}
        {can(admin.role, "canManageSettings") && navItem("/admin/site-content", "Signage Libraries")}
        {can(admin.role, "canManageSettings") && navItem("/admin/testimonials", "Testimonials")}
        {can(admin.role, "canManageSettings") && navItem("/admin/ugc-posts", "Instagram / UGC Feed")}
        {can(admin.role, "canManageSettings") && navItem("/admin/shipping-cities", "Delivery Cities")}
        {can(admin.role, "canManageSettings") && navItem("/admin/settings", "Settings")}
        {can(admin.role, "canManageHelp") && navItem("/admin/help", "Help Center")}
        {can(admin.role, "canManagePages") && navItem("/admin/about-page", "Our Story Page")}
        {can(admin.role, "canManagePages") && navItem("/admin/shipping-returns", "Shipping & Returns")}
        {can(admin.role, "canManagePages") && navItem("/admin/pages", "Site Pages")}
        <div className="mt-auto pt-4 border-t border-border-default">
          <p className="font-body-sm text-body-sm text-text-primary px-2 mb-1">{admin.name}</p>
          <p className="font-label-md text-label-md text-text-secondary px-2 mb-3 capitalize">{admin.role.replace("_", " ")}</p>
          <button
            onClick={signOut}
            className="w-full text-left px-4 py-2 rounded-lg font-body-sm text-body-sm text-red-700 hover:bg-surface-secondary"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8 min-w-0">
        {accessDenied ? (
          <div className="max-w-md">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-sm text-gray-500">
              Your role ({admin.role.replace("_", " ")}) doesn&apos;t have permission to view this page.
              If you believe this is a mistake, ask an admin to update your role.
            </p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}