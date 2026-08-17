"use client";

import { useState } from "react";
import { normalizeQuillHtml } from "@/lib/html-text";
import ProductGallery from "./ProductGallery";
import AddToCart from "./AddToCart";
import WishlistButton from "./WishlistButton";

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

type GalleryImage = {
  id: number;
  url: string;
  is_primary: boolean;
  variant_ids: number[];
};

export default function ProductDetailInteractive({
  productId,
  productName,
  brand,
  category,
  description,
  variants,
  images,
  createdAt,
}: {
  productId: number;
  productName: string;
  brand: string | null;
  category: string | null;
  description: string | null;
  variants: Variant[];
  images: GalleryImage[];
  createdAt?: string;
}) {
  // Owned here (not in AddToCart or ProductGallery individually) so picking a
  // color/size swaps the displayed photo instead of the two staying out of sync.
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    firstAvailable?.id ?? null
  );
  const [openSection, setOpenSection] = useState<string | null>(null);

  const isNew = createdAt
    ? Date.now() - new Date(createdAt).getTime() < 14 * 24 * 60 * 60 * 1000
    : false;

  return (
    <>
      <div className="min-w-0">
        <ProductGallery
          images={images}
          productName={productName}
          selectedVariantId={selectedVariantId}
        />
      </div>

      <div className="min-w-0">
        {isNew && (
          <span className="inline-block bg-brand-primary text-white font-label-md text-label-md uppercase tracking-wider px-2.5 py-1 rounded-full mb-3">
            New
          </span>
        )}
      <div className="flex items-start justify-between gap-3">
          <h1 className="font-display-md text-display-md text-text-primary break-words">
            {productName}
          </h1>
          <WishlistButton productId={productId} className="shrink-0 w-10 h-10 border border-border-default" />
        </div>
        <p className="font-body-sm text-body-sm text-text-secondary mt-1">
          {brand} {category ? `· ${category}` : ""}
        </p>

        <AddToCart
          productId={productId}
          productName={productName}
          variants={variants}
          selectedVariantId={selectedVariantId}
          onVariantChange={setSelectedVariantId}
          imageUrl={images.find((img) => img.is_primary)?.url || images[0]?.url}
        />

        <div className="mt-8 border-t border-border-default">
          {description && (
            <div className="border-b border-border-default">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === "details" ? null : "details")}
                className="w-full flex items-center justify-between py-4 font-label-lg text-label-lg uppercase tracking-wide text-text-primary"
              >
                Product Details
                <span className="material-symbols-outlined text-[20px]">
                  {openSection === "details" ? "remove" : "add"}
                </span>
              </button>
              {openSection === "details" && (
                <div
                  className="font-body-md text-body-md text-text-secondary pb-4 prose prose-sm max-w-none break-words [overflow-wrap:anywhere]"
                  dangerouslySetInnerHTML={{ __html: normalizeQuillHtml(description) }}
                />
              )}
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => setOpenSection(openSection === "shipping" ? null : "shipping")}
              className="w-full flex items-center justify-between py-4 font-label-lg text-label-lg uppercase tracking-wide text-text-primary"
            >
              Shipping &amp; Returns
              <span className="material-symbols-outlined text-[20px]">
                {openSection === "shipping" ? "remove" : "add"}
              </span>
            </button>
            {openSection === "shipping" && (
              <div className="font-body-md text-body-md text-text-secondary pb-4">
                <p>Free shipping across Pakistan. Easy 7-day returns.</p>
                <a href="/shipping-returns" className="text-brand-primary hover:underline">
                  Full shipping &amp; returns policy →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}