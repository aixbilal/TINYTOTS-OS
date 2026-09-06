"use client";

import { useEffect, useState } from "react";

type Store = { name: string; slug: string };

/**
 * "Available at [Store]" for the currently selected PDP variant. Renders
 * nothing while loading, on error, or when no verified store has this exact
 * variant in stock — never a fabricated fallback. Real quantities are never
 * fetched or shown, only which stores have stock (see
 * app/api/stores/availability).
 */
export default function StoreAvailability({
  variantId,
}: {
  variantId: number | null;
}) {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    if (!variantId) return;
    let cancelled = false;
    fetch(`/api/stores/availability?variantId=${variantId}`)
      .then((res) => (res.ok ? res.json() : { locations: [] }))
      .then((json) => {
        if (!cancelled) setStores(Array.isArray(json.locations) ? json.locations : []);
      })
      .catch(() => {
        if (!cancelled) setStores([]);
      });
    return () => {
      cancelled = true;
    };
  }, [variantId]);

  if (stores.length === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-1.5">
      <p className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">
        Available at
      </p>
      {stores.map((store) => (
        <p
          key={store.slug}
          className="flex items-center gap-1.5 font-body-sm text-body-sm text-text-primary"
        >
          <span className="material-symbols-outlined text-[16px] text-brand-primary" aria-hidden="true">
            check_circle
          </span>
          {store.name}
        </p>
      ))}
    </div>
  );
}
