"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Variant = { id: number; color: string | null; size: string | null; price: number; stock: number };
type Product = { id: number; name: string; sku: string; brand: string; category: string; is_active: boolean; variants: Variant[] };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((json) => {
        // /api/inventory returns one row per variant; group into products client-side
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
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-stack-md">
        <h1 className="font-display-md text-display-md text-on-surface">Products</h1>
        <Link
          href="/admin/products/new"
          className="px-5 py-3 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors"
        >
          + Add Product
        </Link>
      </div>

      <input
        placeholder="Search by name or SKU..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-sm border rounded-lg px-4 py-2 mb-4 bg-surface-container-lowest text-on-surface font-body-md text-body-md border-outline-variant focus:border-primary focus:outline-none"
      />

      {loading ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-outline-variant/30">
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Name</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">SKU</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Variants</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Total Stock</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Low Stock?</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const totalStock = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
              const anyLow = p.variants.some((v: any) => v.stock <= (v.reorder_level ?? 5));
              return (
                <tr key={p.id} className="border-b border-outline-variant/10">
                  <td className="py-3 font-body-md text-body-md text-on-surface">{p.name}</td>
                  <td className="py-3 font-body-sm text-body-sm text-on-surface-variant">{p.sku}</td>
                  <td className="py-3 font-body-sm text-body-sm text-on-surface-variant">{p.variants.length}</td>
                  <td className="py-3 font-body-sm text-body-sm text-on-surface-variant">{totalStock}</td>
                  <td className="py-3">
                    {anyLow && (
                      <span className="font-label-md text-label-md text-error">Low stock</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="font-label-md text-label-md text-primary hover:underline">
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