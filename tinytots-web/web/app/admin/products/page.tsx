"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminBadge,
  AdminEmptyState,
  AdminTableWrap,
  AdminTh,
  AdminTd,
} from "@/components/admin/ui";

type Variant = {
  id: number;
  color: string | null;
  size: string | null;
  price: number;
  stock: number;
  reorder_level?: number | null;
};
type Product = { id: number; name: string; sku: string; variants: Variant[] };

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
        // /api/admin/inventory returns one row per variant; group into products
        const grouped: Record<number, Product> = {};
        for (const row of json.data || []) {
          const pid = row.product_id;
          if (!grouped[pid]) {
            grouped[pid] = {
              id: pid,
              name: row.products?.name ?? "Unknown",
              sku: row.products?.sku ?? "",
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
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader
        title="Products"
        description="Catalog and per-variant stock."
        actions={
          <Link href="/admin/products/new">
            <AdminButton variant="primary" className="pointer-events-none">
              <span className="material-symbols-outlined text-[18px]" aria-hidden>add</span>
              Add product
            </AdminButton>
          </Link>
        }
      />

      <div className="mb-4">
        <input
          placeholder="Search by name or SKU…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-sm rounded-md border border-border-default bg-surface-elevated px-3 py-2 font-body-sm text-body-sm text-text-primary focus:border-brand-primary focus:outline-none"
        />
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 font-body-sm text-body-sm text-red-800">
          {error}
        </p>
      )}

      <AdminCard padded={false}>
        {loading ? (
          <p className="px-5 py-10 text-center font-body-sm text-body-sm text-text-secondary">Loading products…</p>
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            icon="inventory_2"
            title={query ? "No matching products" : "No products yet"}
            description={query ? "Try a different name or SKU." : undefined}
          />
        ) : (
          <AdminTableWrap className="rounded-none border-0">
            <thead>
              <tr>
                <AdminTh>Name</AdminTh>
                <AdminTh>SKU</AdminTh>
                <AdminTh className="text-right">Variants</AdminTh>
                <AdminTh className="text-right">Total stock</AdminTh>
                <AdminTh>Stock status</AdminTh>
                <AdminTh />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const totalStock = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
                const anyLow = p.variants.some((v) => (v.stock || 0) <= (v.reorder_level ?? 5));
                return (
                  <tr key={p.id} className="hover:bg-surface-secondary/50">
                    <AdminTd className="max-w-[280px] truncate font-medium">{p.name}</AdminTd>
                    <AdminTd className="whitespace-nowrap text-text-secondary">{p.sku || "—"}</AdminTd>
                    <AdminTd className="text-right tabular-nums text-text-secondary">{p.variants.length}</AdminTd>
                    <AdminTd className="text-right tabular-nums">{totalStock}</AdminTd>
                    <AdminTd>
                      {anyLow ? <AdminBadge tone="danger">Low stock</AdminBadge> : <AdminBadge tone="success">In stock</AdminBadge>}
                    </AdminTd>
                    <AdminTd className="whitespace-nowrap text-right">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-label-md text-label-md font-medium text-brand-primary hover:underline"
                      >
                        Edit
                      </Link>
                    </AdminTd>
                  </tr>
                );
              })}
            </tbody>
          </AdminTableWrap>
        )}
      </AdminCard>
    </div>
  );
}
