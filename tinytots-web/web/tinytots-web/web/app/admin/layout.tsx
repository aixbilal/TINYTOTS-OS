"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth-context";

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
        {navItem("/admin/products", "Products")}
        {navItem("/admin/orders", "Orders")}
        {navItem("/admin/discounts", "Discounts")}
        {navItem("/admin/coupons", "Coupons")}
        {navItem("/admin/complaints", "Complaints")}
        {navItem("/admin/team", "Team")}

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
      <main className="flex-1 p-8">{children}</main>
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