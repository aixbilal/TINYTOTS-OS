"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

export default function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sort, setSort] = useState("newest");
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([catJson, prodJson]) => {
        if (catJson.error) throw new Error(catJson.error);
        if (prodJson.error) throw new Error(prodJson.error);

        const cat = (catJson.categories || []).find((c: Category) => c.slug === slug);
        setCategory(cat || null);

        const catName = cat?.name;
        const filtered = catName
          ? (prodJson.data || []).filter((p: Product) => p.category === catName)
          : prodJson.data || [];
        setProducts(filtered);
      })
      .catch(() => setError("Couldn't load this collection right now. Please try again shortly."))
      .finally(() => setLoading(false));
  }, [slug]);

  const { sizes, colors, priceRange } = useMemo(() => {
    const sizeSet = new Set<string>();
    const colorSet = new Set<string>();
    let min = Infinity;
    let max = 0;
    products.forEach((p) =>
      p.variants.forEach((v) => {
        if (v.size) sizeSet.add(v.size);
        if (v.color) colorSet.add(v.color);
        const price = v.web_price ?? v.price;
        if (price < min) min = price;
        if (price > max) max = price;
      })
    );
    return {
      sizes: Array.from(sizeSet).sort(),
      colors: Array.from(colorSet).sort(),
      priceRange: { min: min === Infinity ? 0 : min, max },
    };
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const variants = p.variants;
      if (selectedSizes.size > 0 && !variants.some((v) => v.size && selectedSizes.has(v.size))) return false;
      if (selectedColors.size > 0 && !variants.some((v) => v.color && selectedColors.has(v.color))) return false;
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
      return b.id - a.id; // newest first, assuming higher id = newer
    });

    return list;
  }, [products, selectedSizes, selectedColors, maxPrice, sort]);

  function toggleSize(s: string) {
    setSelectedSizes((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
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

      {sizes.length > 0 && (
        <div>
          <p className="font-label-lg text-label-lg text-on-surface font-semibold mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">straighten</span> Size
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => toggleSize(s)}
                className={`px-3 py-1.5 rounded-full font-label-md text-label-md border transition-colors ${
                  selectedSizes.has(s)
                    ? "bg-primary-container text-on-primary-container border-primary-container"
                    : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <p className="font-label-lg text-label-lg text-on-surface font-semibold mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">palette</span> Color
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
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
        </div>
      )}

      {priceRange.max > 0 && (
        <div>
          <p className="font-label-lg text-label-lg text-on-surface font-semibold mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">payments</span> Max Price
          </p>
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
        </div>
      )}
    </div>
  );

  return (
    <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg">
      {/* Breadcrumb */}
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

      {error && <p className="font-body-sm text-body-sm text-error mb-stack-md">{error}</p>}

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
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src={p.image_url}
                          alt={p.name}
                        />
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