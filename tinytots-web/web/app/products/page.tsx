"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import WishlistButton from "@/components/WishlistButton";
import {
  CACHE_KEYS,
  isBrowserOffline,
  fetchWithSessionCache,
  readSessionJson,
  writeSessionJson,
} from "@/lib/client-cache";
import { useOnline } from "@/hooks/useOnline";

type Category = { name: string; slug: string };

function CategoriesDropdown() {
  const online = useOnline();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "unavailable">(
    "idle"
  );
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;

    const cached = readSessionJson<Category[]>(CACHE_KEYS.categories) ?? [];
    if (cached.length > 0 && categories.length === 0) {
      setCategories(cached);
      setStatus("ready");
    }

    if (categories.length > 0 || cached.length > 0) {
      // Refresh in background when online; keep cached list visible.
      if (!online) {
        setStatus("ready");
        return;
      }
    }

    if (!online) {
      setStatus(cached.length > 0 || categories.length > 0 ? "ready" : "unavailable");
      return;
    }

    if (categories.length > 0) return;

    setStatus("loading");
    let cancelled = false;
    fetchWithSessionCache<Category[]>(
      CACHE_KEYS.categories,
      "/api/categories",
      online,
      (json) => json.categories || []
    ).then(({ data }) => {
      if (cancelled) return;
      const list = data || [];
      setCategories(list);
      setStatus(list.length > 0 ? "ready" : "unavailable");
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, online]);

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
        className="flex items-center gap-2 font-button text-button px-4 py-2 rounded-full border border-border-default bg-surface-elevated text-text-primary hover:bg-surface-secondary transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">storefront</span>
        Categories
        <span className="material-symbols-outlined text-[18px]">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 max-h-96 overflow-y-auto bg-surface-elevated border border-border-default rounded-2xl shadow-xl p-2 z-[80]">
          <Link
            href="/products"
            className="block px-3 py-2 rounded-lg font-body-md text-body-md text-brand-primary bg-brand-primary/20 hover:bg-brand-primary/30 transition-colors"
          >
            Shop All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="block px-3 py-2 rounded-lg font-body-md text-body-md text-text-primary hover:bg-surface-secondary transition-colors"
            >
              {c.name}
            </Link>
          ))}
          {status === "loading" && categories.length === 0 && (
            <p className="px-3 py-2 font-body-sm text-body-sm text-text-secondary">
              Loading categories...
            </p>
          )}
          {status === "unavailable" && categories.length === 0 && (
            <p className="px-3 py-2 font-body-sm text-body-sm text-text-secondary">
              {online
                ? "No categories available."
                : "Categories unavailable offline. Use Shop All."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ProductsContent() {
  const online = useOnline();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [softMessage, setSoftMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids");
  const gender = (searchParams.get("gender") || "").trim().toLowerCase();
  const genderFilter =
    gender === "boy" || gender === "girl" || gender === "unisex" ? gender : null;
  const pageTitle =
    genderFilter === "boy"
      ? "Boys"
      : genderFilter === "girl"
        ? "Girls"
        : genderFilter === "unisex"
          ? "Unisex"
          : "Shop All";

  useEffect(() => {
    const params = new URLSearchParams();
    if (ids) params.set("ids", ids);
    if (genderFilter) params.set("gender", genderFilter);
    const qs = params.toString();
    const cacheKey = CACHE_KEYS.productsByQuery(qs);
    const url = qs ? `/api/products?${qs}` : "/api/products";

    const cached = readSessionJson<any[]>(cacheKey) ?? [];
    if (cached.length > 0) {
      setProducts(cached);
      setLoading(false);
      setSoftMessage(null);
    }

    if (isBrowserOffline() || !online) {
      setLoading(false);
      if (cached.length === 0) {
        setSoftMessage("Product list unavailable offline. Reconnect to browse the full catalog.");
      } else {
        setSoftMessage("Showing last viewed products — reconnect for live stock.");
      }
      return;
    }

    if (cached.length === 0) setLoading(true);
    setSoftMessage(null);

    let cancelled = false;
    fetchWithSessionCache<any[]>(cacheKey, url, online, (json) => json.data || []).then(
      ({ data, fromCache, hadError }) => {
        if (cancelled) return;
        setProducts(data || []);
        if (hadError) {
          setSoftMessage(
            !online
              ? "Product list unavailable offline. Reconnect to browse."
              : "Couldn't load products right now. Please try again shortly."
          );
        } else if (fromCache) {
          setSoftMessage("Showing last viewed products — reconnect for live stock.");
        } else {
          setSoftMessage(null);
        }
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [ids, genderFilter, online]);

  return (
    <main className="max-w-container-max mx-auto py-stack-lg">
      <div className="flex items-center justify-between mb-stack-md gap-3">
        <h1 className="font-display-md text-display-md text-text-primary">{pageTitle}</h1>
        <CategoriesDropdown />
      </div>

      {loading && products.length === 0 && (
        <p className="font-body-md text-body-md text-text-secondary">Loading products...</p>
      )}

      {softMessage && (
        <p className="mb-4 font-body-sm text-body-sm text-text-secondary border border-border-default bg-surface-secondary rounded-lg px-4 py-3">
          {softMessage}
        </p>
      )}

      {!loading && products.length === 0 && !softMessage && (
        <p className="font-body-md text-body-md text-text-secondary">No products available yet.</p>
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
              className="group flex flex-col rounded-xl border border-border-default bg-surface-elevated overflow-hidden hover:border-brand-primary transition-colors"
            >
              <div className="relative aspect-square bg-surface-secondary overflow-hidden">
                {p.image_url ? (
                  <>
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className={`object-cover transition-opacity ${
                        p.secondary_image_url
                          ? "group-hover:opacity-0"
                          : "group-hover:scale-105 transition-transform"
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
                  <div className="w-full h-full flex items-center justify-center text-text-secondary font-body-sm text-body-sm">
                    No image
                  </div>
                )}
                <WishlistButton
                  productId={p.id}
                  className="absolute top-2 right-2 bg-surface-elevated/90 backdrop-blur-sm w-8 h-8 shadow-sm"
                />
              </div>
              <div className="p-4 flex flex-col gap-1">
                <p className="font-body-md text-body-md text-text-primary">{p.name}</p>
                <p className="font-body-sm text-body-sm text-text-secondary">{p.brand}</p>
                {hasDiscount && (
                  <span className="self-start font-label-md text-label-md text-white bg-brand-primary px-2 py-0.5 rounded-full">
                    -{variant.web_discount_percent}%
                  </span>
                )}
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-baseline gap-2">
                    <p className="font-headline-md text-headline-md text-brand-primary">
                      {price ? `Rs. ${price.toLocaleString()}` : ""}
                    </p>
                    {hasDiscount && (
                      <p className="font-body-sm text-body-sm text-text-secondary line-through">
                        Rs. {variant.web_base_price.toLocaleString()}
                      </p>
                    )}
                  </div>
                  {!inStock && (
                    <span className="font-label-md text-label-md text-red-700">Out of stock</span>
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
    <Suspense fallback={<main className="max-w-container-max mx-auto py-stack-lg" />}>
      <ProductsContent />
    </Suspense>
  );
}
