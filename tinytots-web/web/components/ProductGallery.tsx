"use client";

import { useState } from "react";

type GalleryImage = { id: number; url: string; is_primary: boolean };

export default function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const sorted = images.slice(); // already sorted by sort_order from the query
  const primaryIndex = Math.max(0, sorted.findIndex((img) => img.is_primary));
  const [activeIndex, setActiveIndex] = useState(primaryIndex === -1 ? 0 : primaryIndex);

  if (sorted.length === 0) {
    return (
      <div className="aspect-square rounded-[16px] overflow-hidden border border-outline-variant/30 bg-surface-container-low flex items-center justify-center text-on-surface-variant">
        No image
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square rounded-[16px] overflow-hidden border border-outline-variant/30 bg-surface-container-low">
        <img
          className="w-full h-full object-cover"
          src={sorted[activeIndex].url}
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
              style={{ borderColor: i === activeIndex ? "#9c422e" : "transparent" }}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}