"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const LINKS = [
  { href: "/account", label: "Profile & Settings", icon: "person" },
  { href: "/account#orders", label: "Orders & Returns", icon: "local_shipping" },
  { href: "/account/addresses", label: "Saved Addresses", icon: "location_on" },
  { href: "/account/wishlist", label: "Wishlist", icon: "favorite" },
];

export default function AccountSidebar({ name }: { name?: string | null }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const initial = (name?.trim()?.[0] || "T").toUpperCase();

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-surface-container-low rounded-2xl p-6 h-fit sticky top-28 border border-outline/10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-display-md text-headline-md">
          {initial}
        </div>
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">
            {name || "My Account"}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Member</p>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-body-sm text-body-sm ${
                active
                  ? "bg-surface border border-outline/10 text-primary font-label-lg font-semibold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high"
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
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-sm text-body-sm mt-4 text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </nav>
    </aside>
  );
}
