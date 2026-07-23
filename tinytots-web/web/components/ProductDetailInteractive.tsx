"use client";

import { useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import ProductGallery from "./ProductGallery";
import AddToCart from "./AddToCart";

type Variant = {
  id: number;
  color: string | null;
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
}: {
  productId: number;
  productName: string;
  brand: string | null;
  category: string | null;
  description: string | null;
  variants: Variant[];
  images: GalleryImage[];
}) {
  // Owned here (not in AddToCart or ProductGallery individually) so picking a
  // color/size swaps the displayed photo instead of the two staying out of sync.
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    firstAvailable?.id ?? null
  );

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
        <h1 className="font-display-md text-display-md text-on-surface break-words">
          {productName}
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          {brand} {category ? `· ${category}` : ""}
        </p>
        {description && (
          <div
            className="font-body-md text-body-md text-on-surface-variant mt-4 prose prose-sm max-w-none break-words [overflow-wrap:anywhere]"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
          />
        )}

        <AddToCart
          productId={productId}
          productName={productName}
          variants={variants}
          selectedVariantId={selectedVariantId}
          onVariantChange={setSelectedVariantId}
        />
      </div>
    </>
  );
}