"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AccountMenu() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-2 rounded-full flex items-center justify-center opacity-50">
        <span className="material-symbols-outlined">person</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <Link
          href="/login"
          className="hidden md:inline-block font-body-sm text-body-sm text-text-secondary hover:text-brand-primary px-3 py-2 rounded-full transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="hidden md:inline-block font-body-sm text-body-sm bg-brand-primary text-white px-4 py-2 rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Sign up
        </Link>
        <Link
          href="/login"
          className="md:hidden text-text-secondary hover:text-brand-primary transition-colors hover:bg-surface-secondary p-2 rounded-full flex items-center justify-center"
          title="Account"
          aria-label="Account"
        >
          <span className="material-symbols-outlined">person</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-brand-primary hover:bg-surface-secondary p-2 rounded-full flex items-center justify-center"
        title="Account"
      >
        <span className="material-symbols-outlined">account_circle</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-surface-elevated border border-border-default rounded-xl shadow-lg py-2 z-50">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 font-body-sm text-body-sm text-text-primary hover:bg-surface-secondary"
          >
            My Account
          </Link>
          <Link
            href="/account/wishlist"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 font-body-sm text-body-sm text-text-primary hover:bg-surface-secondary"
          >
            My Wishlist
          </Link>
          <button
            onClick={async () => {
              setOpen(false);
              await signOut();
            }}
            className="block w-full text-left px-4 py-2 font-body-sm text-body-sm text-red-700 hover:bg-surface-secondary"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
