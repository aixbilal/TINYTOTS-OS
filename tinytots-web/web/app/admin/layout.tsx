"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth-context";
import { can } from "@/lib/admin-permissions";

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
  { prefix: "/admin/team", permission: "canManageTeam" },
  { prefix: "/admin/settings", permission: "canManageSettings" },
  { prefix: "/admin/homepage", permission: "canManageSettings" },
  { prefix: "/admin/shipping-cities", permission: "canManageSettings" },
  { prefix: "/admin/help", permission: "canManageHelp" },
  { prefix: "/admin/pages", permission: "canManagePages" },
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

  useEffect(() => {
    if (!loading && !admin && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [loading, admin, isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <main className="p-8 font-body-md text-body-md text-on-surface-variant">
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
        className={`block px-4 py-2 rounded-lg font-body-sm text-body-sm ${
          active
            ? "bg-primary-container text-on-primary"
            : "text-on-surface-variant hover:bg-surface-container-low"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-outline-variant/30 bg-surface-container-lowest p-4 flex flex-col gap-1">
        <div className="font-display-sm text-display-sm text-primary mb-4 px-2">TinyTots Admin</div>
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
        {navItem("/admin/account", "My Account")}
        {can(admin.role, "canManageTeam") && navItem("/admin/team", "Team")}
        {can(admin.role, "canManageSettings") && navItem("/admin/homepage", "Homepage")}
        {can(admin.role, "canManageSettings") && navItem("/admin/shipping-cities", "Delivery Cities")}
        {can(admin.role, "canManageSettings") && navItem("/admin/settings", "Settings")}
{can(admin.role, "canManageHelp") && navItem("/admin/help", "Help Center")}
{can(admin.role, "canManagePages") && navItem("/admin/pages", "Site Pages")}
        <div className="mt-auto pt-4 border-t border-outline-variant/20">
          <p className="font-body-sm text-body-sm text-on-surface px-2 mb-1">{admin.name}</p>
          <p className="font-label-md text-label-md text-on-surface-variant px-2 mb-3 capitalize">{admin.role.replace("_", " ")}</p>
          <button
            onClick={signOut}
            className="w-full text-left px-4 py-2 rounded-lg font-body-sm text-body-sm text-error hover:bg-surface-container-low"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        {accessDenied ? (
          <div className="max-w-md">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-sm text-gray-500">
              Your role ({admin.role.replace("_", " ")}) doesn't have permission to view this page.
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