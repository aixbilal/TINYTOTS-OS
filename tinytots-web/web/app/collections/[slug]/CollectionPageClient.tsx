"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  buildSizeFilterOptions,
  productMatchesSizeFilter,
} from "@/lib/size-filter";
import { CACHE_KEYS, readSessionJson, writeSessionJson } from "@/lib/client-cache";

type Variant = { id: number; color: string | null; size: string | null; price: number; web_price: number | null; stock: number };
type Product = {
  id: number;
  name: string;
  category: string | null;
  image_url: string | null;
  variants: Variant[];
};
type Category = { id: number; name: string; slug: string };

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A–Z" },
];

const COLOR_PREVIEW_COUNT = 10;

export default function CollectionPageClient({
  slug,
  initialCategory,
  initialProducts,
}: {
  slug: string;
  initialCategory: Category | null;
  initialProducts: Product[];
}) {
  const [category, setCategory] = useState<Category | null>(initialCategory);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(null);

  const [sort, setSort] = useState("newest");
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Size + Price open by default; Color collapsed.
  const [openGroups, setOpenGroups] = useState({ size: true, color: false, price: true });
  const [showAllColors, setShowAllColors] = useState(false);

  // Server already gave us category + products for the common case (this
  // was pre-rendered via generateStaticParams / ISR in page.tsx). Only fall
  // back to a client fetch — with the existing offline-cache logic — if the
  // server pass came back empty (e.g. a brand-new category created after
  // the last build, before the next 60s revalidation picks it up).
  useEffect(() => {
    if (initialProducts.length > 0) {
      setLoading(false);
      return;
    }

    const catCache = readSessionJson<{ id: number; name: string; slug: string }[]>(CACHE_KEYS.categories);
    const prodCache = readSessionJson<Product[]>(CACHE_KEYS.productsByQuery("all"));

    const applyCached = () => {
      if (catCache?.length) {
        const cat = catCache.find((c) => c.slug === slug) || null;
        setCategory(cat);
        if (prodCache?.length) {
          const catName = cat?.name;
          setProducts(
            catName ? prodCache.filter((p) => p.category === catName) : prodCache
          );
        }
      }
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      applyCached();
      setLoading(false);
      if (!catCache?.length && !prodCache?.length) {
        setError("This collection isn’t available offline. Reconnect to load it.");
      }
      return;
    }

    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([catJson, prodJson]) => {
        if (catJson.error) throw new Error(catJson.error);
        if (prodJson.error) throw new Error(prodJson.error);

        const cats = catJson.categories || [];
        writeSessionJson(CACHE_KEYS.categories, cats);
        const allProducts = prodJson.data || [];
        writeSessionJson(CACHE_KEYS.productsByQuery("all"), allProducts);

        const cat = cats.find((c: Category) => c.slug === slug);
        setCategory(cat || null);

        const catName = cat?.name;
        const filtered = catName
          ? allProducts.filter((p: Product) => p.category === catName)
          : allProducts;
        setProducts(filtered);
        setError(null);
      })
      .catch(() => {
        applyCached();
        if (!navigator.onLine) {
          setError(
            prodCache?.length
              ? null
              : "This collection isn’t available offline. Reconnect to load it."
          );
        } else if (!prodCache?.length) {
          setError("Couldn't load this collection right now. Please try again shortly.");
        }
      })
      .finally(() => setLoading(false));
  }, [slug, initialProducts.length]);

  const { sizeOptions, colorsByFreq, priceRange } = useMemo(() => {
    const rawSizes: string[] = [];
    const colorCounts = new Map<string, number>();
    let min = Infinity;
    let max = 0;

    products.forEach((p) =>
      p.variants.forEach((v) => {
        if (v.size) rawSizes.push(v.size);
        if (v.color) colorCounts.set(v.color, (colorCounts.get(v.color) || 0) + 1);
        const price = v.web_price ?? v.price;
        if (price < min) min = price;
        if (price > max) max = price;
      })
    );

    const colorsByFreq = [...colorCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([color]) => color);

    return {
      sizeOptions: buildSizeFilterOptions(rawSizes),
      colorsByFreq,
      priceRange: { min: min === Infinity ? 0 : min, max },
    };
  }, [products]);

  const visibleColors = showAllColors
    ? colorsByFreq
    : colorsByFreq.slice(0, COLOR_PREVIEW_COUNT);
  const hasMoreColors = colorsByFreq.length > COLOR_PREVIEW_COUNT;

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const variants = p.variants;
      if (!productMatchesSizeFilter(variants, selectedSizes)) return false;
      if (selectedColors.size > 0 && !variants.some((v) => v.color && selectedColors.has(v.color))) {
        return false;
      }
      if (maxPrice !== null) {
        const minVariantPrice = Math.min(...variants.map((v) => v.web_price ?? v.price));
        if (minVariantPrice > maxPrice) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      const aPrice = Math.min(...a.variants.map((v) => v.web_price ?? v.price));
      const bPrice = Math.min(...b.variants.map((v) => v.web_price ?? v.price));
      if (sort === "price_asc") return aPrice - bPrice;
      if (sort === "price_desc") return bPrice - aPrice;
      if (sort === "name") return a.name.localeCompare(b.name);
      return b.id - a.id;
    });

    return list;
  }, [products, selectedSizes, selectedColors, maxPrice, sort]);

  function toggleSize(token: string) {
    setSelectedSizes((prev) => {
      const next = new Set(prev);
      next.has(token) ? next.delete(token) : next.add(token);
      return next;
    });
  }

  function toggleColor(c: string) {
    setSelectedColors((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }

  function clearAll() {
    setSelectedSizes(new Set());
    setSelectedColors(new Set());
    setMaxPrice(null);
  }

  function toggleGroup(key: keyof typeof openGroups) {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const hasActiveFilters = selectedSizes.size > 0 || selectedColors.size > 0 || maxPrice !== null;

  const FiltersPanel = (
    <div className="flex flex-col gap-stack-md">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md text-on-surface">Filters</h2>
        {hasActiveFilters && (
          <button onClick={clearAll} className="font-label-md text-label-md text-primary hover:underline">
            Clear All
          </button>
        )}
      </div>

      {sizeOptions.length > 0 && (
        <div className="border-b border-outline-variant/20 pb-stack-md">
          <button
            type="button"
            onClick={() => toggleGroup("size")}
            className="w-full flex items-center justify-between gap-2 font-label-lg text-label-lg text-on-surface font-semibold mb-2"
            aria-expanded={openGroups.size}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">straighten</span> Size
              {selectedSizes.size > 0 && (
                <span className="font-label-md text-label-md text-primary font-normal">
                  ({selectedSizes.size})
                </span>
              )}
            </span>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              {openGroups.size ? "expand_less" : "expand_more"}
            </span>
          </button>
          {openGroups.size && (
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((opt) => (
                <button
                  key={opt.token}
                  type="button"
                  onClick={() => toggleSize(opt.token)}
                  className={`px-3 py-1.5 rounded-full font-label-md text-label-md border transition-colors ${
                    selectedSizes.has(opt.token)
                      ? "bg-primary-container text-on-primary-container border-primary-container"
                      : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {colorsByFreq.length > 0 && (
        <div className="border-b border-outline-variant/20 pb-stack-md">
          <button
            type="button"
            onClick={() => toggleGroup("color")}
            className="w-full flex items-center justify-between gap-2 font-label-lg text-label-lg text-on-surface font-semibold mb-2"
            aria-expanded={openGroups.color}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">palette</span> Color
              {selectedColors.size > 0 && (
                <span className="font-label-md text-label-md text-primary font-normal">
                  ({selectedColors.size})
                </span>
              )}
            </span>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              {openGroups.color ? "expand_less" : "expand_more"}
            </span>
          </button>
          {openGroups.color && (
            <>
              <div className="flex flex-wrap gap-2">
                {visibleColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleColor(c)}
                    className={`px-3 py-1.5 rounded-full font-label-md text-label-md border transition-colors ${
                      selectedColors.has(c)
                        ? "bg-primary-container text-on-primary-container border-primary-container"
                        : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {hasMoreColors && (
                <button
                  type="button"
                  onClick={() => setShowAllColors((v) => !v)}
                  className="mt-2 font-label-md text-label-md text-primary hover:underline"
                >
                  {showAllColors
                    ? "Show fewer colors"
                    : `Show all colors (${colorsByFreq.length})`}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {priceRange.max > 0 && (
        <div>
          <button
            type="button"
            onClick={() => toggleGroup("price")}
            className="w-full flex items-center justify-between gap-2 font-label-lg text-label-lg text-on-surface font-semibold mb-2"
            aria-expanded={openGroups.price}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">payments</span> Max Price
            </span>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              {openGroups.price ? "expand_less" : "expand_more"}
            </span>
          </button>
          {openGroups.price && (
            <>
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                value={maxPrice ?? priceRange.max}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Up to Rs. {(maxPrice ?? priceRange.max).toLocaleString()}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg">
      <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant mb-stack-sm">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-surface">{category?.name || "Shop"}</span>
      </div>

      <div className="flex justify-between items-end mb-stack-md flex-wrap gap-4">
        <div>
          <h1 className="font-display-md text-display-md text-on-surface mb-1">
            {category?.name || "Shop All"}
          </h1>
          {!loading && <p className="font-body-md text-body-md text-on-surface-variant">{filtered.length} items found</p>}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="md:hidden flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg font-button text-button text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span> Filter
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-outline-variant rounded-lg px-4 py-2 font-body-sm text-body-sm bg-surface-container-lowest text-on-surface"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort by: {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="font-body-sm text-body-sm text-on-surface-variant border border-outline-variant/40 bg-surface-container-low rounded-lg px-4 py-3 mb-stack-md">
          {error}
        </p>
      )}

      <div className="flex flex-col md:flex-row gap-gutter">
        <aside className={`w-full md:w-64 shrink-0 ${showFilters ? "block" : "hidden"} md:block`}>
          {FiltersPanel}
        </aside>

        <div className="flex-grow min-w-0">
          {loading ? (
            <p className="font-body-md text-body-md text-on-surface-variant">Loading products...</p>
          ) : filtered.length === 0 ? (
            <div className="border border-dashed border-outline-variant/40 rounded-2xl p-12 flex flex-col items-center text-center gap-3">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant">search_off</span>
              <p className="font-body-md text-body-md text-on-surface-variant">
                No products match your filters right now.
              </p>
              {hasActiveFilters && (
                <button onClick={clearAll} className="font-body-sm text-body-sm text-primary hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-bento-gap">
              {filtered.map((p) => {
                const minPrice = Math.min(...p.variants.map((v) => v.web_price ?? v.price));
                const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                return (
                  <Link key={p.id} href={`/products/${p.id}`} className="group cursor-pointer">
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-outline-variant/30 mb-3 bg-surface-container-lowest">
                      {p.image_url ? (
                        <>
                          <Image
                            className={`object-cover transition-opacity duration-300 ${
                              (p as any).secondary_image_url ? "group-hover:opacity-0" : "group-hover:scale-105 transition-transform duration-500"
                            }`}
                            src={p.image_url}
                            alt={p.name}
                            fill
                            sizes="(max-width: 1024px) 50vw, 33vw"
                          />
                          {(p as any).secondary_image_url && (
                            <Image
                              className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              src={(p as any).secondary_image_url}
                              alt=""
                              aria-hidden="true"
                              fill
                              sizes="(max-width: 1024px) 50vw, 33vw"
                            />
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-sm">
                          No image
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-surface/90 backdrop-blur px-2 py-1 rounded-full font-label-md text-[11px] text-on-surface-variant">
                        <span className="material-symbols-outlined text-[12px] text-tertiary">check_circle</span>
                        {totalStock > 0 ? "In Stock" : "Out of Stock"}
                      </div>
                    </div>
                    <h3 className="font-body-md text-body-md text-on-surface">{p.name}</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">Rs. {minPrice.toLocaleString()}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}