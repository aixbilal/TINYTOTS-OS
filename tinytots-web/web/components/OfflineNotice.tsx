"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Banner for live-only pages (cart, checkout). Those routes are NetworkOnly
 * in the service worker — when offline, show an explicit message instead of
 * a silent failure.
 */
export default function OfflineNotice({ feature = "this page" }: { feature?: string }) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      className="mb-stack-md rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-left"
    >
      <p className="font-headline-sm text-headline-sm text-on-surface mb-1">
        You&apos;re offline
      </p>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {feature} can&apos;t run live offline (prices, stock, orders). Cached
        storefront pages may still work.{" "}
        <Link href="/offline" className="text-primary underline underline-offset-2">
          More info
        </Link>
      </p>
    </div>
  );
}
