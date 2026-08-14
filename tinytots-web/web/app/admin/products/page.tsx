"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";

type Variant = { id: number; color: string | null; size: string | null; price: number; stock: number };
type Product = { id: number; name: string; sku: string; brand: string; category: string; is_active: boolean; variants: Variant[] };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    adminFetch("/api/admin/inventory")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) {
          setProducts([]);
          setError(json.error || "Failed to load products.");
          return;
        }
        // /api/admin/inventory returns one row per variant; group into products client-side
        const grouped: Record<number, Product> = {};
        for (const row of json.data || []) {
          const pid = row.product_id;
          if (!grouped[pid]) {
            grouped[pid] = {
              id: pid,
              name: row.products?.name ?? "Unknown",
              sku: row.products?.sku ?? "",
              brand: "",
              category: "",
              is_active: true,
              variants: [],
            };
          }
          grouped[pid].variants.push(row);
        }
        setProducts(Object.values(grouped));
      })
      .catch(() => {
        setProducts([]);
        setError("Failed to load products.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-stack-md">
        <h1 className="font-display-md text-display-md text-text-primary">Products</h1>
        <Link
          href="/admin/products/new"
          className="px-5 py-3 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity"
        >
          + Add Product
        </Link>
      </div>

      <input
        placeholder="Search by name or SKU..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-sm border rounded-lg px-4 py-2 mb-4 bg-surface-elevated text-text-primary font-body-md text-body-md border-border-default focus:border-brand-primary focus:outline-none"
      />

      {error && (
        <p className="font-body-md text-body-md text-red-700 mb-4">{error}</p>
      )}

      {loading ? (
        <p className="font-body-md text-body-md text-text-secondary">Loading...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-border-default">
              <th className="py-2 font-label-md text-label-md text-text-secondary">Name</th>
              <th className="py-2 font-label-md text-label-md text-text-secondary">SKU</th>
              <th className="py-2 font-label-md text-label-md text-text-secondary">Variants</th>
              <th className="py-2 font-label-md text-label-md text-text-secondary">Total Stock</th>
              <th className="py-2 font-label-md text-label-md text-text-secondary">Low Stock?</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const totalStock = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
              const anyLow = p.variants.some((v: any) => v.stock <= (v.reorder_level ?? 5));
              return (
                <tr key={p.id} className="border-b border-border-default">
                  <td className="py-3 font-body-md text-body-md text-text-primary">{p.name}</td>
                  <td className="py-3 font-body-sm text-body-sm text-text-secondary">{p.sku}</td>
                  <td className="py-3 font-body-sm text-body-sm text-text-secondary">{p.variants.length}</td>
                  <td className="py-3 font-body-sm text-body-sm text-text-secondary">{totalStock}</td>
                  <td className="py-3">
                    {anyLow && (
                      <span className="font-label-md text-label-md text-red-700">Low stock</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="font-label-md text-label-md text-brand-primary hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}