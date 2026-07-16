"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setProducts(json.data || []);
      })
      .catch(() => setError("Couldn't load products right now. Please try again shortly."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">Shop All</h1>

      {loading && (
        <p className="font-body-md text-body-md text-on-surface-variant">Loading products...</p>
      )}

      {error && (
        <p className="font-body-sm text-body-sm text-error border border-error/30 bg-error-container/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="font-body-md text-body-md text-on-surface-variant">No products available yet.</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-bento-gap">
        {products.map((p) => {
          const inStock = p.variants?.some((v: any) => v.stock > 0);
          const price = p.variants?.[0]?.web_price ?? p.variants?.[0]?.price;
          return (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="group flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden hover:border-primary transition-colors"
            >
              <div className="aspect-square bg-surface-container-low overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-body-sm text-body-sm">
                    No image
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col gap-1">
                <p className="font-body-md text-body-md text-on-surface">{p.name}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{p.brand}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="font-headline-md text-headline-md text-primary">
                    {price ? `Rs. ${price.toLocaleString()}` : ""}
                  </p>
                  {!inStock && (
                    <span className="font-label-md text-label-md text-error">Out of stock</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}