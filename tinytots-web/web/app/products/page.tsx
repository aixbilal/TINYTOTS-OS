"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import WishlistButton from "@/components/WishlistButton";

function CategoriesDropdown() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open || categories.length > 0) return;
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => setCategories(json.categories || []))
      .catch(() => setCategories([]));
  }, [open, categories.length]);

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function scheduleHide() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div className="relative inline-block" onMouseEnter={show} onMouseLeave={scheduleHide}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 font-button text-button px-4 py-2 rounded-full border border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">storefront</span>
        Categories
        <span className="material-symbols-outlined text-[18px]">{open ? "expand_less" : "expand_more"}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 max-h-96 overflow-y-auto bg-surface border border-outline-variant/30 rounded-2xl shadow-xl p-2 z-[80]">
          <Link
            href="/products"
            className="block px-3 py-2 rounded-lg font-body-md text-body-md text-primary bg-primary-container/20 hover:bg-primary-container/30 transition-colors"
          >
            Shop All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="block px-3 py-2 rounded-lg font-body-md text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
            >
              {c.name}
            </Link>
          ))}
          {categories.length === 0 && (
            <p className="px-3 py-2 font-body-sm text-body-sm text-on-surface-variant">Loading categories...</p>
          )}
        </div>
      )}
    </div>
  );
}

function ProductsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids");
  const gender = (searchParams.get("gender") || "").trim().toLowerCase();
  const genderFilter =
    gender === "boy" || gender === "girl" || gender === "unisex" ? gender : null;
  const pageTitle =
    genderFilter === "boy" ? "Boys" : genderFilter === "girl" ? "Girls" : genderFilter === "unisex" ? "Unisex" : "Shop All";

  useEffect(() => {
    const params = new URLSearchParams();
    if (ids) params.set("ids", ids);
    if (genderFilter) params.set("gender", genderFilter);
    const qs = params.toString();
    const url = qs ? `/api/products?${qs}` : "/api/products";
    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setProducts(json.data || []);
      })
      .catch(() => setError("Couldn't load products right now. Please try again shortly."))
      .finally(() => setLoading(false));
  }, [ids, genderFilter]);

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <div className="flex items-center justify-between mb-stack-md">
        <h1 className="font-display-md text-display-md text-on-surface">{pageTitle}</h1>
        <CategoriesDropdown />
      </div>

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
          const variant = p.variants?.[0];
          const price = variant?.web_price ?? variant?.price;
          const hasDiscount = variant?.web_discount_percent > 0 && variant?.web_base_price;
          return (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="group flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden hover:border-primary transition-colors"
            >
           <div className="relative aspect-square bg-surface-container-low overflow-hidden">
                {p.image_url ? (
                  <>
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className={`object-cover transition-opacity ${
                        p.secondary_image_url ? "group-hover:opacity-0" : "group-hover:scale-105 transition-transform"
                      }`}
                    />
                    {p.secondary_image_url && (
                      <Image
                        src={p.secondary_image_url}
                        alt=""
                        aria-hidden="true"
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-body-sm text-body-sm">
                    No image
                  </div>
                )}
                <WishlistButton
                  productId={p.id}
                  className="absolute top-2 right-2 bg-surface/90 backdrop-blur-sm w-8 h-8 shadow-sm"
                />
              </div>
              <div className="p-4 flex flex-col gap-1">
                <p className="font-body-md text-body-md text-on-surface">{p.name}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{p.brand}</p>
                {hasDiscount && (
                  <span className="self-start font-label-md text-label-md text-white bg-primary px-2 py-0.5 rounded-full">
                    -{variant.web_discount_percent}%
                  </span>
                )}
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-baseline gap-2">
                    <p className="font-headline-md text-headline-md text-primary">
                      {price ? `Rs. ${price.toLocaleString()}` : ""}
                    </p>
                    {hasDiscount && (
                      <p className="font-body-sm text-body-sm text-on-surface-variant line-through">
                        Rs. {variant.web_base_price.toLocaleString()}
                      </p>
                    )}
                  </div>
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

export default function ProductsPage() {
  return (
    <Suspense fallback={<main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg" />}>
      <ProductsContent />
    </Suspense>
  );
}