"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  image_url: string | null;
  secondary_image_url?: string | null;
  variants: { price: number; web_price: number | null; stock: number }[];
}

interface Tab {
  key: string;
  label: string;
  products: Product[];
}

type Layout = "grid" | "scroll";

function ProductCard({ product, layout }: { product: Product; layout: Layout }) {
  const prices = product.variants.map((v) => v.web_price ?? v.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  const widthClass =
    layout === "scroll"
      ? // % resolves against the scrollport so ~2 peek on mobile, ~4 fit on desktop
        "shrink-0 w-[45%] md:w-[calc((100%-60px)/4)]"
      : "shrink-0 w-[45%] sm:w-auto sm:shrink";

  return (
    <Link href={`/products/${product.id}`} className={`group cursor-pointer ${widthClass}`}>
      <div className="relative w-full aspect-square rounded-[16px] overflow-hidden border border-outline-variant/30 mb-4 bg-surface-container-lowest">
        {totalStock > 0 && totalStock <= 5 && (
          <div className="absolute top-2 left-2 bg-[#D9822B] text-white font-label-md text-label-md px-2 py-1 rounded-full z-10">
            Few Left
          </div>
        )}
        {product.image_url ? (
          <>
            <img
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                product.secondary_image_url ? "group-hover:opacity-0" : "group-hover:scale-105 transition-transform duration-500"
              }`}
              src={product.image_url}
              alt={product.name}
            />
            {product.secondary_image_url && (
              <img
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                src={product.secondary_image_url}
                alt=""
                aria-hidden="true"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full bg-surface-container flex items-center justify-center text-on-surface-variant text-sm">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-body-sm md:font-body-md text-body-sm md:text-body-md text-on-surface line-clamp-1">{product.name}</h3>
        <p className="font-body-sm md:font-body-md text-body-sm md:text-body-md text-on-surface-variant">Rs. {minPrice.toLocaleString()}</p>
      </div>
    </Link>
  );
}

export default function ProductCarouselTabs({
  tabs,
  layout = "grid",
}: {
  tabs: Tab[];
  layout?: Layout;
}) {
  const nonEmptyTabs = tabs.filter((t) => t.products.length > 0);
  const [activeKey, setActiveKey] = useState(nonEmptyTabs[0]?.key);
  const active = nonEmptyTabs.find((t) => t.key === activeKey) || nonEmptyTabs[0];
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const activeCount = active?.products.length ?? 0;

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(max > 4 && el.scrollLeft < max - 4);
  }, []);

  useLayoutEffect(() => {
    if (layout !== "scroll") return;
    const el = scrollerRef.current;
    if (!el) return;

    const tick = () => updateScrollState();
    tick();
    // Cards/images can settle a frame later; re-measure so arrows enable correctly.
    const raf = requestAnimationFrame(tick);
    const t = window.setTimeout(tick, 100);

    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [layout, activeKey, activeCount, updateScrollState]);

  if (nonEmptyTabs.length === 0 || !active) {
    return <p className="text-on-surface-variant">No products available right now.</p>;
  }

  function scrollByPage(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  const trackClass =
    layout === "scroll"
      ? "flex gap-bento-gap overflow-x-auto no-scrollbar scroll-smooth"
      : "flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-bento-gap overflow-x-auto sm:overflow-visible no-scrollbar";

  return (
    <div>
      <div className="flex items-center gap-2 mb-stack-md overflow-x-auto no-scrollbar">
        {nonEmptyTabs.length > 1 ? (
          nonEmptyTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveKey(tab.key)}
              className={`shrink-0 font-button text-button px-5 py-2 rounded-full border transition-colors ${
                active.key === tab.key
                  ? "bg-primary-container text-on-primary border-primary-container"
                  : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-low"
              }`}
            >
              {tab.label}
            </button>
          ))
        ) : (
          <h2 className="font-headline-lg text-on-surface">{active.label}</h2>
        )}
        <Link
          href="/products"
          className="ml-auto shrink-0 font-body-sm text-body-sm text-primary hover:underline whitespace-nowrap"
        >
          View All
        </Link>
      </div>

      <div className="relative">
        {layout === "scroll" && (
          <>
            <button
              type="button"
              aria-label="Scroll related products left"
              onClick={() => scrollByPage(-1)}
              disabled={!canScrollLeft}
              className={`hidden md:flex absolute left-0 top-[38%] -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest shadow-sm transition-opacity ${
                canScrollLeft ? "opacity-100 hover:bg-surface-container-low" : "opacity-0 pointer-events-none"
              }`}
            >
              <span className="material-symbols-outlined text-[22px] text-on-surface">chevron_left</span>
            </button>
            <button
              type="button"
              aria-label="Scroll related products right"
              onClick={() => scrollByPage(1)}
              disabled={!canScrollRight}
              className={`hidden md:flex absolute right-0 top-[38%] -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest shadow-sm transition-opacity ${
                canScrollRight ? "opacity-100 hover:bg-surface-container-low" : "opacity-0 pointer-events-none"
              }`}
            >
              <span className="material-symbols-outlined text-[22px] text-on-surface">chevron_right</span>
            </button>
          </>
        )}

        <div ref={layout === "scroll" ? scrollerRef : undefined} className={trackClass}>
          {active.products.map((product) => (
            <ProductCard key={product.id} product={product} layout={layout} />
          ))}
        </div>
      </div>
    </div>
  );
}
