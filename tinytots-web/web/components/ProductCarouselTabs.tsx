"use client";

import { useState } from "react";
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

function ProductCard({ product }: { product: Product }) {
  const prices = product.variants.map((v) => v.web_price ?? v.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <Link href={`/products/${product.id}`} className="group cursor-pointer shrink-0 w-[45%] sm:w-auto sm:shrink">
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

export default function ProductCarouselTabs({ tabs }: { tabs: Tab[] }) {
  const nonEmptyTabs = tabs.filter((t) => t.products.length > 0);
  const [activeKey, setActiveKey] = useState(nonEmptyTabs[0]?.key);

  if (nonEmptyTabs.length === 0) {
    return <p className="text-on-surface-variant">No products available right now.</p>;
  }

  const active = nonEmptyTabs.find((t) => t.key === activeKey) || nonEmptyTabs[0];

  return (
    <div>
      <div className="flex items-center gap-2 mb-stack-md overflow-x-auto no-scrollbar">
        {nonEmptyTabs.map((tab) => (
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
        ))}
        <Link
          href="/products"
          className="ml-auto shrink-0 font-body-sm text-body-sm text-primary hover:underline whitespace-nowrap"
        >
          View All
        </Link>
      </div>

      <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-bento-gap overflow-x-auto sm:overflow-visible no-scrollbar">
        {active.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
