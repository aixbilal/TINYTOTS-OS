"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const LINKS = [
  { href: "/account", label: "Overview", icon: "dashboard" },
  { href: "/account/orders", label: "Order History", icon: "local_shipping" },
  { href: "/account/wishlist", label: "Wishlist & Saved Items", icon: "favorite" },
  { href: "/account/addresses", label: "Profile & Addresses", icon: "person" },
  { href: "/account#vouchers", label: "My Coupons", icon: "confirmation_number" },
  { href: "/track-order", label: "Track Your Order", icon: "location_on" },
  { href: "/account/returns", label: "Returns & Exchanges", icon: "assignment_return" },
  { href: "/account/settings", label: "Login & Security", icon: "lock" },
];

function SidebarLinks({ name, pathname, signOut, onNavigate }: {
  name?: string | null;
  pathname: string | null;
  signOut: () => void;
  onNavigate?: () => void;
}) {
  const initial = (name?.trim()?.[0] || "T").toUpperCase();
  return (
    <>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center font-display-md text-headline-md">
          {initial}
        </div>
        <div>
          <h3 className="font-headline-md text-headline-md text-text-primary">
            {name || "My Account"}
          </h3>
          <p className="font-body-sm text-body-sm text-text-secondary">Member</p>
        </div>
      </div>
      <nav className="flex flex-col gap-2">
        {LINKS.map((link) => {
          const active =
            link.href === "/account"
              ? pathname === "/account"
              : pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-body-sm text-body-sm ${
                active
                  ? "bg-surface-elevated border border-border-subtle text-brand-primary font-label-lg font-semibold shadow-sm"
                  : "text-text-secondary hover:bg-surface-secondary"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-surface-secondary transition-colors font-body-sm text-body-sm mt-4 text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </nav>
    </>
  );
}

export default function AccountSidebar({ name }: { name?: string | null }) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar, unchanged */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-surface-secondary rounded-2xl p-6 h-fit sticky top-28 border border-border-subtle">
        <SidebarLinks name={name} pathname={pathname} signOut={signOut} />
      </aside>

      {/* Mobile: a trigger bar + off-canvas drawer, since the sidebar itself is hidden below md */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface-secondary border border-border-subtle font-body-sm text-body-sm text-text-primary"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">menu</span>
            Account Menu
          </span>
          <span className="material-symbols-outlined text-[20px] text-text-secondary">chevron_right</span>
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-[110] flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85vw] h-full bg-surface-secondary p-6 overflow-y-auto">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close account menu"
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-surface-tertiary"
            >
              <span className="material-symbols-outlined text-[22px] text-text-secondary">close</span>
            </button>
            <SidebarLinks name={name} pathname={pathname} signOut={signOut} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
