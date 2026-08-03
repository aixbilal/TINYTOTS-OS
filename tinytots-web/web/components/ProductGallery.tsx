"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type GalleryImage = {
  id: number;
  url: string;
  is_primary: boolean;
  variant_ids?: number[];
};

const SWIPE_THRESHOLD_PX = 48;

export default function ProductGallery({
  images,
  productName,
  selectedVariantId,
}: {
  images: GalleryImage[];
  productName: string;
  selectedVariantId?: number | null;
}) {
  const forVariant = selectedVariantId
    ? images.filter((img) => (img.variant_ids ?? []).includes(selectedVariantId))
    : [];
  const untagged = images.filter((img) => !(img.variant_ids && img.variant_ids.length > 0));
  const sorted = forVariant.length > 0 ? forVariant : untagged.length > 0 ? untagged : images;

  const primaryIndex = Math.max(0, sorted.findIndex((img) => img.is_primary));
  const [activeIndex, setActiveIndex] = useState(primaryIndex === -1 ? 0 : primaryIndex);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    setActiveIndex(primaryIndex === -1 ? 0 : primaryIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariantId]);

  const goTo = useCallback(
    (i: number) => {
      if (sorted.length === 0) return;
      setActiveIndex(((i % sorted.length) + sorted.length) % sorted.length);
    },
    [sorted.length]
  );

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    // Prefer horizontal swipe over vertical scroll.
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goTo(activeIndex + 1);
    else goTo(activeIndex - 1);
  };

  if (sorted.length === 0) {
    return (
      <div className="aspect-square rounded-[16px] overflow-hidden border border-outline-variant/30 bg-surface-container-low flex items-center justify-center text-on-surface-variant">
        No image
      </div>
    );
  }

  const displayImage = sorted[activeIndex] ?? sorted[0];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-square rounded-[16px] overflow-hidden border border-outline-variant/30 bg-surface-container-low touch-pan-y select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => {
          touchStartX.current = null;
          touchStartY.current = null;
        }}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${productName} images`}
      >
        {sorted.map((img, i) => {
          const isActive = i === activeIndex;
          return (
            <div
              key={img.id}
              className={`absolute inset-0 transition-opacity duration-300 ${
                isActive ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none"
              }`}
              aria-hidden={!isActive}
            >
              <Image
                className="object-cover"
                src={img.url}
                alt={isActive ? productName : ""}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={i === 0}
                draggable={false}
              />
            </div>
          );
        })}

        {sorted.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[2] flex items-center gap-1.5 md:hidden">
            {sorted.map((img, i) => (
              <button
                key={img.id}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === activeIndex ? true : undefined}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex ? "w-6 bg-white shadow" : "w-2 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors"
              style={{ borderColor: img.id === displayImage.id ? "#9c422e" : "transparent" }}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
