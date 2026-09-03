"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  { prefix: "/admin/help-content", permission: "canManageHelp" },
  { prefix: "/admin/pages", permission: "canManagePages" },
  { prefix: "/admin/about-page", permission: "canManagePages" },
  { prefix: "/admin/shipping-returns", permission: "canManagePages" },
];

function getRequiredPermission(pathname: string) {
  const match = ROUTE_PERMISSIONS.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  return match?.permission;
}

// --- Grouped navigation -----------------------------------------------------
// Route + permission pairs are unchanged from the flat list; only the visual
// grouping is new. `perm: null` = visible to any active team member.
type NavItem = { href: string; label: string; icon: string; perm: Parameters<typeof can>[1] | null };
type NavGroup = { label: string | null; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", perm: null }] },
  {
    label: "Operations",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "receipt_long", perm: "canManageOrders" },
      { href: "/admin/reports", label: "Reports", icon: "bar_chart", perm: "canManageOrders" },
      { href: "/admin/complaints", label: "Complaints", icon: "support_agent", perm: "canHandleComplaints" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: "inventory_2", perm: "canManageInventory" },
      { href: "/admin/categories", label: "Categories", icon: "category", perm: "canManageInventory" },
    ],
  },
  {
    label: "Promotions",
    items: [
      { href: "/admin/discounts", label: "Discounts", icon: "percent", perm: "canManageDiscounts" },
      { href: "/admin/coupons", label: "Coupons", icon: "confirmation_number", perm: "canManageCoupons" },
      { href: "/admin/referrals", label: "Referrals", icon: "group_add", perm: "canManageReferrals" },
      { href: "/admin/vouchers", label: "Vouchers", icon: "card_giftcard", perm: "canManageReferrals" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/homepage", label: "Homepage", icon: "home", perm: "canManageSettings" },
      { href: "/admin/blog", label: "Blog", icon: "article", perm: "canManageBlog" },
      { href: "/admin/blog-content", label: "Blog Page Content", icon: "feed", perm: "canManageBlog" },
      { href: "/admin/help", label: "Help Center", icon: "help_center", perm: "canManageHelp" },
      { href: "/admin/help-content", label: "Help Page Content", icon: "quiz", perm: "canManageHelp" },
      { href: "/admin/about-page", label: "Our Story Page", icon: "auto_stories", perm: "canManagePages" },
      { href: "/admin/shipping-returns", label: "Shipping & Returns", icon: "local_shipping", perm: "canManagePages" },
      { href: "/admin/pages", label: "Site Pages", icon: "description", perm: "canManagePages" },
      { href: "/admin/testimonials", label: "Testimonials", icon: "reviews", perm: "canManageSettings" },
      { href: "/admin/ugc-posts", label: "Instagram / UGC Feed", icon: "photo_library", perm: "canManageSettings" },
    ],
  },
  {
    label: "Store experience",
    items: [
      { href: "/admin/campaigns", label: "Campaigns", icon: "campaign", perm: "canManageSettings" },
      { href: "/admin/site-content", label: "Signage Libraries", icon: "collections", perm: "canManageSettings" },
      { href: "/admin/shipping-cities", label: "Delivery Cities", icon: "pin_drop", perm: "canManageSettings" },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/admin/team", label: "Team", icon: "groups", perm: "canManageTeam" },
      { href: "/admin/settings", label: "Settings", icon: "settings", perm: "canManageSettings" },
    ],
  },
  { label: "Account", items: [{ href: "/admin/account", label: "My Account", icon: "person", perm: null }] },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, loading, signOut } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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

  const visibleGroups = useMemo(() => {
    if (!admin) return [];
    return NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((it) => it.perm === null || can(admin.role, it.perm)),
    })).filter((g) => g.items.length > 0);
  }, [admin]);

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-surface-canvas p-8">
        <p className="font-body-sm text-body-sm text-text-secondary">Checking admin access…</p>
      </main>
    );
  }

  if (!admin) {
    // Redirect effect above will fire; render nothing meanwhile
    return null;
  }

  const requiredPermission = getRequiredPermission(pathname || "");
  const accessDenied = requiredPermission && !can(admin.role, requiredPermission);

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href + "/")) ||
      (item.href !== "/admin" && pathname === item.href);
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2.5 rounded-md px-3 py-2 font-body-sm text-body-sm transition-colors ${
          active
            ? "bg-brand-primary text-white"
            : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
        }`}
      >
        <span className={`material-symbols-outlined text-[19px] ${active ? "text-white" : "text-text-secondary"}`} aria-hidden>
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <span className="font-headline-md text-headline-md font-semibold text-text-primary">
          TinyTots <span className="text-brand-primary">Admin</span>
        </span>
        <button
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
          className="lg:hidden rounded-md p-1 text-text-secondary hover:bg-surface-secondary"
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden>close</span>
        </button>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-1 pb-2">
        {visibleGroups.map((g, gi) => (
          <div key={gi}>
            {g.label && (
              <p className="px-3 pb-1 font-label-md text-[11px] font-semibold uppercase tracking-wider text-text-secondary/70">
                {g.label}
              </p>
            )}
            <div className="space-y-0.5">
              {g.items.map((it) => (
                <NavLink key={it.href} item={it} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-2 border-t border-border-default px-3 pt-3">
        <p className="truncate font-body-sm text-body-sm text-text-primary">{admin.name}</p>
        <p className="mb-2 font-label-md text-label-md capitalize text-text-secondary">
          {admin.role.replace("_", " ")}
        </p>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 font-body-sm text-body-sm text-red-700 hover:bg-red-50"
        >
          <span className="material-symbols-outlined text-[19px]" aria-hidden>logout</span>
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface-canvas lg:flex">
      {/* Mobile / tablet top bar (< lg) */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border-default bg-surface-elevated px-4 py-2.5 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          aria-expanded={sidebarOpen}
          className="rounded-md p-1.5 text-text-primary hover:bg-surface-secondary"
        >
          <span className="material-symbols-outlined text-[24px]" aria-hidden>menu</span>
        </button>
        <span className="font-headline-md text-headline-md font-semibold text-text-primary">
          TinyTots <span className="text-brand-primary">Admin</span>
        </span>
      </header>

      {/* Drawer backdrop (< lg) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar: off-canvas drawer < lg, persistent >= lg */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-border-default bg-surface-elevated py-3 transition-transform duration-200 ease-out
          lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {sidebarContent}
      </aside>

      {/* Main content region */}
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        {accessDenied ? (
          <div className="mx-auto max-w-md rounded-lg border border-border-default bg-surface-elevated p-6">
            <h1 className="font-headline-lg text-headline-lg font-semibold text-text-primary">Access denied</h1>
            <p className="mt-2 font-body-sm text-body-sm text-text-secondary">
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
