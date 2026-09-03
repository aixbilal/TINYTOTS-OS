"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth-context";
import { can } from "@/lib/admin-permissions";
import { supabase } from "@/lib/supabase";
import { PRIMARY_NAV, ACCOUNT_NAV, type NavGroup, type NavLeaf, type PermSpec } from "@/lib/admin-nav";

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
  { prefix: "/admin/signage", permission: "canManageSettings" },
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

// --- Permission helpers ----------------------------------------------------

function permAllowed(perm: PermSpec, role: Parameters<typeof can>[0]) {
  if (perm == null) return true;
  const list = Array.isArray(perm) ? perm : [perm];
  return list.some((p) => can(role, p));
}

function isChildActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, loading, signOut } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Manual accordion override — the group the user explicitly opened *in
  // addition to* the active one. The active group is always expanded and is
  // derived from the route, so it never needs to live in state.
  const [openKey, setOpenKey] = useState<string | null>(null);

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

  // Only groups (and children) the current role can access.
  const visibleGroups = useMemo(() => {
    if (!admin) return [] as NavGroup[];
    return PRIMARY_NAV.map((g) => ({
      ...g,
      items: g.items.filter((it) => permAllowed(it.perm, admin.role)),
    })).filter((g) => g.items.length > 0);
  }, [admin]);

  // Which group contains the current route.
  const activeGroupKey = useMemo(() => {
    const p = pathname || "";
    // Prefer the most specific child match across all groups.
    let best: { key: string; len: number } | null = null;
    for (const g of visibleGroups) {
      for (const it of g.items) {
        if (isChildActive(p, it.href) && (!best || it.href.length > best.len)) {
          best = { key: g.key, len: it.href.length };
        }
      }
    }
    return best?.key ?? null;
  }, [pathname, visibleGroups]);

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

  const ChildLink = ({ item, nested }: { item: NavLeaf; nested?: boolean }) => {
    const active = isChildActive(pathname || "", item.href);
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2.5 rounded-md py-2 font-body-sm text-body-sm transition-colors ${
          nested ? "pl-9 pr-3" : "px-3"
        } ${
          active
            ? "bg-brand-primary text-white"
            : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[19px] ${active ? "text-white" : "text-text-secondary"}`}
          aria-hidden
        >
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const GroupBlock = ({ group }: { group: NavGroup }) => {
    // Single-destination group (Dashboard) → plain link, no accordion.
    if (group.items.length === 1 && group.items[0].href === group.href) {
      return <ChildLink item={{ ...group.items[0], label: group.label, icon: group.icon }} />;
    }
    const groupActive = activeGroupKey === group.key;
    // Active group is always open; the user can additionally open one other.
    const expanded = groupActive || openKey === group.key;
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            if (groupActive) return; // active group stays open
            setOpenKey(openKey === group.key ? null : group.key);
          }}
          aria-expanded={expanded}
          className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 font-body-sm text-body-sm font-medium transition-colors ${
            groupActive && !expanded
              ? "bg-surface-secondary text-text-primary"
              : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-[19px] text-text-secondary" aria-hidden>
            {group.icon}
          </span>
          <span className="flex-1 truncate text-left">{group.label}</span>
          <span
            className={`material-symbols-outlined text-[18px] text-text-secondary transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            aria-hidden
          >
            expand_more
          </span>
        </button>
        {expanded && (
          <div className="mt-0.5 space-y-0.5">
            {group.items.map((it) => (
              <ChildLink key={it.href} item={it} nested />
            ))}
          </div>
        )}
      </div>
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
      <nav className="flex-1 space-y-1 overflow-y-auto px-1 pb-2">
        {visibleGroups.map((g) => (
          <GroupBlock key={g.key} group={g} />
        ))}
      </nav>
      <div className="mt-2 border-t border-border-default px-3 pt-3">
        <Link
          href={ACCOUNT_NAV.href}
          aria-current={isChildActive(pathname || "", ACCOUNT_NAV.href) ? "page" : undefined}
          className={`mb-1 flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors ${
            isChildActive(pathname || "", ACCOUNT_NAV.href)
              ? "bg-surface-secondary"
              : "hover:bg-surface-secondary"
          }`}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-primary/10 font-label-md text-label-md font-semibold uppercase text-brand-primary">
            {admin.name?.[0] || "?"}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-body-sm text-body-sm text-text-primary">{admin.name}</span>
            <span className="block truncate font-label-md text-label-md capitalize text-text-secondary">
              {admin.role.replace("_", " ")}
            </span>
          </span>
        </Link>
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
