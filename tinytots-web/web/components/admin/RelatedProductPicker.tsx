"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

export type RelatedProductLite = {
  id: number;
  name: string;
  image_url?: string | null;
  sku?: string | null;
};

/** Homepage-style search + multi-select for related product ID lists. */
export default function RelatedProductPicker({
  label,
  helpText,
  productIds,
  products,
  excludeId,
  onChange,
}: {
  label: string;
  helpText?: string;
  productIds: number[];
  products: RelatedProductLite[];
  excludeId?: number;
  onChange: (ids: number[]) => void;
}) {
  const [search, setSearch] = useState("");
  const selectedIds = useMemo(() => new Set(productIds), [productIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (excludeId != null && p.id === excludeId) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q)
      );
    });
  }, [products, search, excludeId]);

  function toggle(id: number) {
    if (selectedIds.has(id)) onChange(productIds.filter((x) => x !== id));
    else onChange([...productIds, id]);
  }

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-1">{label}</h2>
      {helpText && <p className="text-sm text-gray-500 mb-3">{helpText}</p>}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products..."
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      <p className="text-xs text-gray-500 mb-2">{selectedIds.size} selected</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto">
        {filtered.map((p) => {
          const selected = selectedIds.has(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={`flex items-center gap-2 border rounded-md p-2 text-left transition-colors ${
                selected ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0 relative">
                {p.image_url && (
                  <Image src={p.image_url} alt="" fill className="object-cover" unoptimized />
                )}
              </div>
              <span className="text-sm text-gray-800 line-clamp-2">{p.name}</span>
              {selected && (
                <span className="material-symbols-outlined text-gray-900 text-[18px] ml-auto">check</span>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 col-span-full">No products match your search.</p>
        )}
      </div>
    </div>
  );
}
