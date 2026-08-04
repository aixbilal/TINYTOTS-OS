"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";

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

function normColor(color: string | null | undefined): string | null {
  const t = (color || "").trim();
  return t.length > 0 ? t : null;
}

function normSize(size: string | null | undefined): string {
  const t = (size || "").trim();
  return t.length > 0 ? t : "One Size";
}

function sizeSortKey(size: string): [number, number, string] {
  const range = size.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) return [0, Number(range[1]), size];
  if (/^\d+$/.test(size)) return [0, Number(size), size];
  const letterOrder = ["XS", "S", "M", "L", "XL", "XXL"];
  const li = letterOrder.indexOf(size.toUpperCase());
  if (li >= 0) return [1, li, size];
  return [2, 0, size];
}

function compareSizes(a: string, b: string) {
  const ka = sizeSortKey(a);
  const kb = sizeSortKey(b);
  return ka[0] - kb[0] || ka[1] - kb[1] || ka[2].localeCompare(kb[2]);
}

function findVariant(
  variants: Variant[],
  color: string | null,
  size: string
): Variant | undefined {
  return variants.find((v) => normColor(v.color) === color && normSize(v.size) === size);
}

function pickBestVariant(variants: Variant[]): Variant | undefined {
  return variants.find((v) => v.stock > 0) ?? variants[0];
}

export default function AddToCart({
  productId,
  productName,
  variants,
  selectedVariantId,
  onVariantChange,
}: {
  productId: number;
  productName: string;
  variants: Variant[];
  // Optional: pass these to let a parent (e.g. the gallery) stay in sync
  // with the picked color/size. Omit them and this component manages its
  // own selection, same as before.
  selectedVariantId?: number | null;
  onVariantChange?: (variantId: number) => void;
}) {
  const { addItem } = useCart();
  const firstAvailable = pickBestVariant(variants);
  const [internalSelectedId, setInternalSelectedId] = useState<number | null>(
    firstAvailable?.id ?? null
  );

  const isControlled = selectedVariantId !== undefined;
  const selectedId = isControlled ? selectedVariantId : internalSelectedId;
  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const [added, setAdded] = useState(false);

  const colors = useMemo(() => {
    const set = new Set<string>();
    for (const v of variants) {
      const c = normColor(v.color);
      if (c) set.add(c);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [variants]);

  const hasColorAxis = colors.length > 0;
  const showColorSelector = colors.length > 1;

  const selectedColor = hasColorAxis ? normColor(selected?.color) ?? colors[0] : null;

  const allSizes = useMemo(() => {
    const set = new Set<string>();
    for (const v of variants) set.add(normSize(v.size));
    return [...set].sort(compareSizes);
  }, [variants]);

  const showSizeSelector = allSizes.length > 1;
  const selectedSize = selected ? normSize(selected.size) : allSizes[0] ?? "One Size";

  function displayPrice(v: Variant) {
    return v.web_price ?? v.price;
  }

  function selectVariant(v: Variant) {
    if (onVariantChange) onVariantChange(v.id);
    if (!isControlled) setInternalSelectedId(v.id);
  }

  function stockFor(color: string | null, size: string): number {
    return findVariant(variants, color, size)?.stock ?? 0;
  }

  function selectColor(color: string) {
    const currentSize = selectedSize;
    const sameSize = findVariant(variants, color, currentSize);
    if (sameSize && sameSize.stock > 0) {
      selectVariant(sameSize);
      return;
    }
    // Prefer an in-stock size in this color; otherwise keep the same size even if OOS.
    const inColor = variants.filter((v) => normColor(v.color) === color);
    const next = pickBestVariant(inColor) ?? sameSize ?? inColor[0];
    if (next) selectVariant(next);
  }

  function selectSize(size: string) {
    const color = selectedColor;
    const match = findVariant(variants, color, size);
    if (match) {
      selectVariant(match);
      return;
    }
    // No exact match for this color+size — fall back within the size across colors.
    const anySize = variants.filter((v) => normSize(v.size) === size);
    const next = pickBestVariant(anySize) ?? anySize[0];
    if (next) selectVariant(next);
  }

  function handleAddToCart() {
    if (!selected || selected.stock === 0) return;
    addItem(
      {
        variantId: selected.id,
        productId,
        productName,
        size: selected.size,
        color: selected.color,
        price: displayPrice(selected),
        maxStock: selected.stock,
      },
      1
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const stockLabel = selected
    ? (() => {
        const colorPart = normColor(selected.color);
        const sizePart = normSize(selected.size);
        const combo =
          colorPart && sizePart !== "One Size"
            ? `${colorPart} · ${sizePart}`
            : colorPart || sizePart;
        return selected.stock > 0
          ? `${selected.stock} in stock for ${combo}`
          : `Out of stock for ${combo}`;
      })()
    : "";

  return (
    <div>
      {selected && (
        <div className="mt-2 flex items-baseline gap-3">
          <p className="font-headline-lg text-headline-lg text-primary">
            Rs. {displayPrice(selected).toLocaleString()}
          </p>
          {selected.web_discount_percent && selected.web_discount_percent > 0 && selected.web_base_price && (
            <>
              <p className="font-body-md text-body-md text-on-surface-variant line-through">
                Rs. {selected.web_base_price.toLocaleString()}
              </p>
              <span className="font-label-md text-label-md text-white bg-primary px-2 py-0.5 rounded-full">
                -{selected.web_discount_percent}%
              </span>
            </>
          )}
        </div>
      )}

      {hasColorAxis && (
        <div className="mt-6">
          <p className="font-label-lg text-label-lg text-on-surface mb-2">
            Color{selectedColor ? `: ${selectedColor}` : ""}
          </p>
          {showColorSelector && (
            <div className="flex flex-wrap gap-2" role="listbox" aria-label="Color">
              {colors.map((color) => {
                const colorVariants = variants.filter((v) => normColor(v.color) === color);
                const colorHasStock = colorVariants.some((v) => v.stock > 0);
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectColor(color)}
                    disabled={!colorHasStock && !isSelected}
                    className={`px-4 py-2 rounded-lg border font-body-sm text-body-sm transition-colors ${
                      isSelected
                        ? "border-primary bg-primary-container text-on-primary"
                        : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                    } ${!colorHasStock ? "opacity-40" : ""}`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className={hasColorAxis ? "mt-4" : "mt-6"}>
        <p className="font-label-lg text-label-lg text-on-surface mb-2">
          Size{showSizeSelector ? "" : selectedSize ? `: ${selectedSize}` : ""}
        </p>
        {showSizeSelector && (
          <div className="flex flex-wrap gap-2" role="listbox" aria-label="Size">
            {allSizes.map((size) => {
              const match = findVariant(variants, selectedColor, size);
              const stock = match?.stock ?? 0;
              const exists = !!match;
              const isSelected = selectedSize === size;
              const unavailable = !exists || stock === 0;
              return (
                <button
                  key={size}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => exists && selectSize(size)}
                  disabled={!exists}
                  title={
                    !exists
                      ? selectedColor
                        ? `Not available in ${selectedColor}`
                        : "Not available"
                      : stock === 0
                        ? "Out of stock"
                        : undefined
                  }
                  className={`min-w-[3rem] px-4 py-2 rounded-lg border font-body-sm text-body-sm transition-colors ${
                    isSelected
                      ? "border-primary bg-primary-container text-on-primary"
                      : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                  } ${unavailable ? "opacity-30 line-through" : ""} ${
                    !exists ? "cursor-not-allowed" : ""
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-3 font-body-sm text-body-sm text-on-surface-variant">{stockLabel}</p>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!selected || selected.stock === 0}
        className="mt-6 w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {added ? "Added ✓" : "Add to Cart"}
      </button>
    </div>
  );
}