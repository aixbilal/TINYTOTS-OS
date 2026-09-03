"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import WishlistButton from "@/components/WishlistButton";
import {
  CACHE_KEYS,
  isBrowserOffline,
  fetchWithSessionCache,
  readSessionJson,
} from "@/lib/client-cache";
import { useOnline } from "@/hooks/useOnline";
import { compareSizes, groupSizesForDisplay } from "@/lib/size-sort";
import InternalTrustStrip from "@/components/InternalTrustStrip";

type Category = { name: string; slug: string };
type Variant = {
  id: number;
  color: string | null;
  color_hex: string | null;
  size: string | null;
  price: number;
  web_price: number | null;
  web_base_price: number | null;
  web_discount_percent: number | null;
  stock: number;
};
type Product = {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
  gender: string | null;
  image_url: string | null;
  secondary_image_url: string | null;
  created_at: string;
  variants: Variant[];
};

type ShopContent = {
  hero_eyebrow: string;
  hero_headline: string;
  hero_subtext: string;
  hero_image_url: string;
  hero_image_url_mobile: string;
};

export const DEFAULT_SHOP_CONTENT: ShopContent = {
  hero_eyebrow: "Shop All",
  hero_headline: "Timeless styles for little hearts.",
  hero_subtext: "Discover thoughtfully made pieces for every moment, every season, every little adventure.",
  hero_image_url: "",
  hero_image_url_mobile: "",
};

const PAGE_SIZE_ROWS = 5; // 5 rows per page, per Dev Bilal's brief
const CARDS_PER_ROW_DESKTOP = 4;
const PAGE_SIZE = PAGE_SIZE_ROWS * CARDS_PER_ROW_DESKTOP;
const NEW_WINDOW_DAYS = 14;

type SortKey = "newest" | "price_asc" | "price_desc" | "name";

function isNew(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

function ShopHero({ content }: { content: ShopContent }) {
  return (
    <section className="relative w-screen left-1/2 -translate-x-1/2 aspect-[4/5] sm:aspect-[21/9] mb-stack-lg overflow-hidden bg-surface-canvas">
      {content.hero_image_url_mobile ? (
        <Image
          src={content.hero_image_url_mobile}
          alt=""
          fill
          sizes="100vw"
          className="object-cover sm:hidden"
          priority
        />
      ) : (
        <div className="absolute inset-0 sm:hidden bg-surface-secondary" />
      )}
      {content.hero_image_url ? (
        <Image
          src={content.hero_image_url}
          alt=""
          fill
          sizes="100vw"
          className="object-cover hidden sm:block"
          priority
        />
      ) : (
        <div className="absolute inset-0 hidden sm:block bg-surface-secondary" />
      )}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(250,247,242,0.92) 0%, rgba(250,247,242,0.5) 40%, rgba(250,247,242,0) 65%)",
        }}
      />
      <div className="absolute inset-0 z-[2] flex flex-col justify-center px-6 sm:px-10 md:px-16">
        <div className="max-w-md">
          <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-3 block">
            {content.hero_eyebrow}
          </span>
          <h1 className="font-display-xl text-[30px] sm:text-[36px] md:text-[44px] text-text-primary leading-[1.15] tracking-tight mb-4">
            {content.hero_headline}
          </h1>
          <p className="font-body-md text-body-md text-text-secondary max-w-sm">{content.hero_subtext}</p>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const inStock = product.variants?.some((v) => v.stock > 0);
  const variant = product.variants?.[0];
  const price = variant?.web_price ?? variant?.price;
  const hasDiscount = (variant?.web_discount_percent ?? 0) > 0 && variant?.web_base_price;
  const swatches = Array.from(
    new Map(
      (product.variants || [])
        .filter((v) => v.color_hex && /^#[0-9A-Fa-f]{6}$/.test(v.color_hex))
        .map((v) => [v.color_hex as string, v.color || v.color_hex])
    ).entries()
  );

  return (
    <Link href={`/products/${product.id}`} className="group flex flex-col cursor-pointer">
      <div className="relative aspect-square overflow-hidden border border-border-default bg-surface-elevated mb-3">
        {isNew(product.created_at) && (
          <span className="absolute top-2 left-2 z-10 bg-brand-primary text-white font-label-md text-label-md px-2 py-1 rounded-full uppercase tracking-wide">
            New
          </span>
        )}
        <WishlistButton
          productId={product.id}
          className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm w-8 h-8 shadow-sm rounded-full"
        />
        {product.image_url ? (
          <>
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className={`object-cover transition-opacity duration-300 ${
                product.secondary_image_url ? "group-hover:opacity-0" : "group-hover:scale-105 transition-transform duration-500"
              }`}
            />
            {product.secondary_image_url && (
              <Image
                src={product.secondary_image_url}
                alt=""
                aria-hidden="true"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary font-body-sm text-body-sm">
            No image
          </div>
        )}
        {!inStock && (
          <span className="absolute bottom-2 left-2 z-10 bg-text-primary/85 text-white font-label-md text-label-md px-2 py-1 rounded-full">
            Out of stock
          </span>
        )}
      </div>
      <p className="font-body-md text-body-md text-text-primary">{product.name}</p>
      <div className="flex items-baseline gap-2 mt-0.5">
        <p className="font-headline-md text-headline-md text-text-primary">
          {price ? `Rs. ${price.toLocaleString()}` : ""}
        </p>
        {hasDiscount && variant?.web_base_price && (
          <p className="font-body-sm text-body-sm text-text-secondary line-through">
            Rs. {variant.web_base_price.toLocaleString()}
          </p>
        )}
      </div>
      {swatches.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2">
          {swatches.map(([hex, name]) => (
            <span
              key={hex}
              title={name || hex}
              className="w-3.5 h-3.5 rounded-full border border-border-default shrink-0"
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      )}
    </Link>
  );
}

const SIZE_CHIPS_COLLAPSED_COUNT = 12;

function SizeChipGrid({
  groups,
  sizeFilters,
  onToggle,
}: {
  groups: { label: string; rawValues: string[] }[];
  sizeFilters: Set<string>;
  onToggle: (rawValues: string[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? groups : groups.slice(0, SIZE_CHIPS_COLLAPSED_COUNT);
  const hasMore = groups.length > SIZE_CHIPS_COLLAPSED_COUNT;

  return (
    <div>
      <div className="grid grid-cols-4 gap-1.5">
        {visible.map((group) => {
          const isActive = group.rawValues.some((v) => sizeFilters.has(v));
          return (
            <button
              key={group.label}
              type="button"
              onClick={() => onToggle(group.rawValues)}
              aria-pressed={isActive}
              className={`px-1.5 py-1 rounded-md border font-label-md text-label-md leading-tight transition-colors ${
                isActive
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-border-default text-text-secondary hover:border-brand-primary"
              }`}
            >
              {group.label}
            </button>
          );
        })}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 font-body-sm text-body-sm text-brand-primary hover:underline"
        >
          {expanded ? "Show fewer sizes" : `Show all sizes (${groups.length})`}
        </button>
      )}
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border-default py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full font-label-lg text-label-lg text-text-primary font-semibold uppercase tracking-wider mb-3"
      >
        {title}
        <span className="material-symbols-outlined text-[18px] text-text-secondary">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>
      {open && children}
    </div>
  );
}

export default function ProductsBrowser({
  initialProducts,
  initialCategories,
  initialShopContent,
  initialGender,
  initialIds,
}: {
  initialProducts: Product[];
  initialCategories: Category[];
  initialShopContent: ShopContent;
  initialGender: string | null;
  initialIds: string | null;
}) {
  const online = useOnline();
  const [shopContent, setShopContent] = useState<ShopContent>(initialShopContent);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [softMessage, setSoftMessage] = useState<string | null>(null);
  const ids = initialIds;
  const genderParam = (initialGender || "").trim().toLowerCase();

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [genderFilters, setGenderFilters] = useState<Set<string>>(
    genderParam === "boy" || genderParam === "girl" || genderParam === "unisex"
      ? new Set([genderParam])
      : new Set()
  );
  const [sizeFilters, setSizeFilters] = useState<Set<string>>(new Set());
  const [colorFilters, setColorFilters] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const gridTopRef = useRef<HTMLDivElement>(null);

  // Note: the server page keys this component by gender/ids, so a query-string
  // change from client navigation remounts it with the correct seed state —
  // no effect needed to sync the gender chip.

  // Refresh shop hero content client-side (kept out of the critical SSR path).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/shop-content")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.data) {
          setShopContent({ ...initialShopContent, ...json.data });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialShopContent]);

  // Categories: seeded from the server; only fall back to a client fetch if
  // the server pass came back empty.
  useEffect(() => {
    if (categories.length > 0) return;
    fetchWithSessionCache<Category[]>(
      CACHE_KEYS.categories,
      "/api/categories",
      online,
      (json) => json.categories || []
    ).then(({ data }) => setCategories(data || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Products: server already rendered the initial set. Re-fetch only to keep
  // live stock/price fresh (and to support the offline cache), mirroring the
  // pattern used on the homepage and collection pages.
  useEffect(() => {
    const params = new URLSearchParams();
    if (ids) params.set("ids", ids);
    if (genderParam) params.set("gender", genderParam);
    const qs = params.toString();
    const cacheKey = CACHE_KEYS.productsByQuery(qs);
    const url = qs ? `/api/products?${qs}` : "/api/products";

    const cached = readSessionJson<Product[]>(cacheKey) ?? [];

    if (isBrowserOffline() || !online) {
      if (products.length === 0 && cached.length > 0) {
        setProducts(cached);
      }
      setLoading(false);
      setSoftMessage(
        products.length === 0 && cached.length === 0
          ? "Product list unavailable offline. Reconnect to browse the full catalog."
          : "Showing saved products — reconnect for live stock."
      );
      return;
    }

    // Have server data already: refresh quietly in the background.
    if (products.length === 0 && cached.length > 0) {
      setProducts(cached);
      setLoading(false);
    }
    if (products.length === 0 && cached.length === 0) setLoading(true);

    let cancelled = false;
    fetchWithSessionCache<Product[]>(cacheKey, url, online, (json) => json.data || []).then(
      ({ data, fromCache, hadError }) => {
        if (cancelled) return;
        if (data && data.length > 0) setProducts(data);
        if (hadError && products.length === 0) {
          setSoftMessage("Couldn't load products right now.");
        } else if (fromCache) {
          setSoftMessage("Showing saved products — reconnect for live stock.");
        } else {
          setSoftMessage(null);
        }
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, genderParam, online]);

  // Derive filter option sets from the real fetched catalog - never invented.
  const availableSizes = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => p.variants?.forEach((v) => v.size && s.add(v.size)));
    return Array.from(s).sort(compareSizes);
  }, [products]);

  const sizeGroups = useMemo(() => groupSizesForDisplay(availableSizes), [availableSizes]);

  function toggleSizeGroup(rawValues: string[]) {
    setSizeFilters((prev) => {
      const next = new Set(prev);
      const allSelected = rawValues.every((v) => next.has(v));
      rawValues.forEach((v) => (allSelected ? next.delete(v) : next.add(v)));
      return next;
    });
  }

  const availableColors = useMemo(() => {
    const m = new Map<string, string>();
    products.forEach((p) =>
      p.variants?.forEach((v) => {
        if (v.color_hex && /^#[0-9A-Fa-f]{6}$/.test(v.color_hex)) {
          m.set(v.color_hex, v.color || v.color_hex);
        }
      })
    );
    return Array.from(m.entries());
  }, [products]);

  const priceBounds = useMemo((): [number, number] => {
    let min = Infinity;
    let max = 0;
    products.forEach((p) =>
      p.variants?.forEach((v) => {
        const price = v.web_price ?? v.price;
        if (price < min) min = price;
        if (price > max) max = price;
      })
    );
    if (!Number.isFinite(min)) min = 0;
    return [Math.floor(min), Math.ceil(max)];
  }, [products]);

  const effectivePriceRange = priceRange ?? priceBounds;

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (genderFilters.size > 0 && !(p.gender && genderFilters.has(p.gender))) return false;
      if (sizeFilters.size > 0 && !p.variants?.some((v) => v.size && sizeFilters.has(v.size))) return false;
      if (colorFilters.size > 0 && !p.variants?.some((v) => v.color_hex && colorFilters.has(v.color_hex))) return false;
      const price = p.variants?.[0]?.web_price ?? p.variants?.[0]?.price ?? 0;
      if (price < effectivePriceRange[0] || price > effectivePriceRange[1]) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      const priceA = a.variants?.[0]?.web_price ?? a.variants?.[0]?.price ?? 0;
      const priceB = b.variants?.[0]?.web_price ?? b.variants?.[0]?.price ?? 0;
      switch (sort) {
        case "price_asc":
          return priceA - priceB;
        case "price_desc":
          return priceB - priceA;
        case "name":
          return a.name.localeCompare(b.name);
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return list;
  }, [products, categoryFilter, genderFilters, sizeFilters, colorFilters, effectivePriceRange, sort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, genderFilters, sizeFilters, colorFilters, effectivePriceRange, sort]);

  function toggleSetValue(set: Set<string>, value: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function clearAllFilters() {
    setCategoryFilter("all");
    setGenderFilters(new Set());
    setSizeFilters(new Set());
    setColorFilters(new Set());
    setPriceRange(null);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function goToPage(page: number) {
    const clamped = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(clamped);
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <ShopHero content={shopContent} />

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        <nav className="font-body-sm text-body-sm text-text-secondary mb-stack-md flex items-center gap-2">
          <Link href="/" className="hover:text-brand-primary transition-colors">
            Home
          </Link>
          <span>&gt;</span>
          <span className="text-text-primary">Shop All</span>
        </nav>

        <div className="flex items-center justify-between mb-stack-md gap-3">
          <div />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 font-body-sm text-body-sm text-text-secondary">
              Sort by:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="border border-border-default rounded-full px-3 py-1.5 font-body-sm text-body-sm text-text-primary bg-surface-elevated"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>
        </div>

        {softMessage && (
          <p className="mb-4 font-body-sm text-body-sm text-text-secondary border border-border-default bg-surface-secondary rounded-lg px-4 py-3">
            {softMessage}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
          {/* Filters sidebar */}
          <aside>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-label-lg text-label-lg text-text-primary font-semibold uppercase tracking-wider">
                Filters
              </h2>
              <button onClick={clearAllFilters} className="font-body-sm text-body-sm text-brand-primary hover:underline">
                Clear all
              </button>
            </div>

            <FilterSection title="Category">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`text-left font-body-sm text-body-sm ${categoryFilter === "all" ? "text-brand-primary font-semibold" : "text-text-secondary hover:text-text-primary"}`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => setCategoryFilter(c.name)}
                    className={`text-left font-body-sm text-body-sm ${categoryFilter === c.name ? "text-brand-primary font-semibold" : "text-text-secondary hover:text-text-primary"}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Gender">
              <div className="flex flex-col gap-2">
                {["girl", "boy", "unisex"].map((g) => (
                  <label key={g} className="flex items-center gap-2 font-body-sm text-body-sm text-text-secondary capitalize cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genderFilters.has(g)}
                      onChange={() => toggleSetValue(genderFilters, g, setGenderFilters)}
                      className="accent-brand-primary"
                    />
                    {g === "unisex" ? "Unisex" : `${g}s`}
                  </label>
                ))}
              </div>
            </FilterSection>

            {sizeGroups.length > 0 && (
              <FilterSection title="Size">
                <SizeChipGrid groups={sizeGroups} sizeFilters={sizeFilters} onToggle={toggleSizeGroup} />
              </FilterSection>
            )}

            {availableColors.length > 0 && (
              <FilterSection title="Color">
                <div className="flex flex-wrap gap-2">
                  {availableColors.map(([hex, name]) => (
                    <button
                      key={hex}
                      title={name}
                      onClick={() => toggleSetValue(colorFilters, hex, setColorFilters)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        colorFilters.has(hex) ? "border-brand-primary scale-110" : "border-border-default"
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </FilterSection>
            )}

            {priceBounds[1] > 0 && (
              <FilterSection title="Price">
                <div className="px-1">
                  <input
                    type="range"
                    min={priceBounds[0]}
                    max={priceBounds[1]}
                    value={effectivePriceRange[1]}
                    onChange={(e) => setPriceRange([priceBounds[0], Number(e.target.value)])}
                    className="w-full accent-brand-primary"
                  />
                  <div className="flex justify-between font-body-sm text-body-sm text-text-secondary mt-1">
                    <span>Rs. {priceBounds[0].toLocaleString()}</span>
                    <span>Rs. {effectivePriceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </FilterSection>
            )}
          </aside>

          {/* Product grid */}
          <div>
            {loading && products.length === 0 && (
              <p className="font-body-md text-body-md text-text-secondary">Loading products...</p>
            )}

            {!loading && filtered.length === 0 && (
              <p className="font-body-md text-body-md text-text-secondary">No products match these filters.</p>
            )}

            <div ref={gridTopRef} className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-border-default text-text-primary disabled:opacity-30 hover:border-brand-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1
                  )
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center gap-2">
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="text-text-secondary px-1">…</span>
                      )}
                      <button
                        onClick={() => goToPage(p)}
                        aria-current={p === currentPage ? "page" : undefined}
                        className={`w-9 h-9 flex items-center justify-center rounded-full font-body-sm text-body-sm transition-colors ${
                          p === currentPage
                            ? "bg-brand-primary text-white"
                            : "text-text-primary hover:bg-surface-secondary"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-border-default text-text-primary disabled:opacity-30 hover:border-brand-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <InternalTrustStrip />
    </>
  );
}
