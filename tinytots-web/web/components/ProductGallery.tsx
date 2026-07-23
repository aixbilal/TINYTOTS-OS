"use client";

import { useEffect, useState } from "react";

type GalleryImage = {
  id: number;
  url: string;
  is_primary: boolean;
  variant_ids?: number[];
};

export default function ProductGallery({
  images,
  productName,
  selectedVariantId,
}: {
  images: GalleryImage[];
  productName: string;
  selectedVariantId?: number | null;
}) {
  // Photos tagged for the selected variant take priority (e.g. the "Sea
  // Green" photos when that color is picked). Untagged photos apply to the
  // whole product and are the fallback — this is what keeps pre-existing
  // images (uploaded before this feature existed) showing exactly as before.
  // If a variant has no tagged photos of its own, fall back to the
  // untagged set so the gallery is never empty just because one color
  // hasn't gotten its own photos yet.
  const forVariant = selectedVariantId
    ? images.filter((img) => (img.variant_ids ?? []).includes(selectedVariantId))
    : [];
  const untagged = images.filter((img) => !(img.variant_ids && img.variant_ids.length > 0));
  const sorted = forVariant.length > 0 ? forVariant : untagged.length > 0 ? untagged : images;

  const primaryIndex = Math.max(0, sorted.findIndex((img) => img.is_primary));
  const [activeIndex, setActiveIndex] = useState(primaryIndex === -1 ? 0 : primaryIndex);

  // Jump back to that variant's main photo whenever the selection changes,
  // rather than keeping whatever thumbnail index happened to be active.
  useEffect(() => {
    setActiveIndex(primaryIndex === -1 ? 0 : primaryIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariantId]);

  if (sorted.length === 0) {
    return (
      <div className="aspect-square rounded-[16px] overflow-hidden border border-outline-variant/30 bg-surface-container-low flex items-center justify-center text-on-surface-variant">
        No image
      </div>
    );
  }

  // Guard against a stale activeIndex on the render right after the variant
  // (and therefore `sorted`) changes but before the effect above catches up.
  const displayImage = sorted[activeIndex] ?? sorted[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square rounded-[16px] overflow-hidden border border-outline-variant/30 bg-surface-container-low">
        <img
          className="w-full h-full object-cover"
          src={displayImage.url}
          alt={productName}
        />
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors"
              style={{ borderColor: img.id === displayImage.id ? "#9c422e" : "transparent" }}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}