"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { compareSizes } from "@/lib/size-sort";

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

function normColor(color: string | null | undefined): string | null {
  const t = (color || "").trim();
  return t.length > 0 ? t : null;
}

function normSize(size: string | null | undefined): string {
  const t = (size || "").trim();
  return t.length > 0 ? t : "One Size";
}

function findVariant(
  variants: Variant[],
  color: string | null,
  size: string
): Variant | undefined {
  return variants.find((v) => normColor(v.color) === color && normSize(v.size) === size);
}

function hexForColor(variants: Variant[], color: string): string | null {
  const v = variants.find((v) => normColor(v.color) === color && v.color_hex);
  return v?.color_hex ?? null;
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
  imageUrl,
}: {
  productId: number;
  productName: string;
  variants: Variant[];
  // Optional: pass these to let a parent (e.g. the gallery) stay in sync
  // with the picked color/size. Omit them and this component manages its
  // own selection, same as before.
  selectedVariantId?: number | null;
  onVariantChange?: (variantId: number) => void;
  imageUrl?: string;
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
  const [quantity, setQuantity] = useState(1);

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
        imageUrl,
      },
      quantity
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

  useEffect(() => {
    setQuantity(1);
  }, [selectedId]);

  function handleBuyItNow() {
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
        imageUrl,
      },
      quantity
    );
    window.location.href = "/checkout";
  }

  return (
    <div>
      {selected && (
        <div className="mt-2 flex items-baseline gap-3">
          <p className="font-headline-lg text-headline-lg text-brand-primary">
            Rs. {displayPrice(selected).toLocaleString()}
          </p>
          {(selected.web_discount_percent ?? 0) > 0 && selected.web_base_price && (
            <>
              <p className="font-body-md text-body-md text-text-secondary line-through">
                Rs. {selected.web_base_price.toLocaleString()}
              </p>
              <span className="font-label-md text-label-md text-white bg-brand-primary px-2 py-0.5 rounded-full">
                -{selected.web_discount_percent}%
              </span>
            </>
          )}
        </div>
      )}

      {hasColorAxis && (
        <div className="mt-6">
          <p className="font-label-lg text-label-lg text-text-primary mb-2">
            Color{selectedColor ? `: ${selectedColor}` : ""}
          </p>
          {showColorSelector && (
            <div className="flex flex-wrap gap-3" role="listbox" aria-label="Color">
              {colors.map((color) => {
                const colorVariants = variants.filter((v) => normColor(v.color) === color);
                const colorHasStock = colorVariants.some((v) => v.stock > 0);
                const isSelected = selectedColor === color;
                const hex = hexForColor(variants, color);
                return (
                  <button
                    key={color}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-label={color}
                    title={color}
                    onClick={() => selectColor(color)}
                    disabled={!colorHasStock && !isSelected}
                    className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? "border-brand-primary" : "border-transparent hover:border-border-default"
                    } ${!colorHasStock ? "opacity-40" : ""}`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-black/10"
                      style={{ backgroundColor: hex || "#D4D4D4" }}
                    />
                    {isSelected && (
                      <span className="material-symbols-outlined absolute text-[14px] text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.6)]">
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className={hasColorAxis ? "mt-4" : "mt-6"}>
        <p className="font-label-lg text-label-lg text-text-primary mb-2">
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
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-border-default text-text-secondary hover:bg-surface-secondary"
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

      <p className="mt-3 font-body-sm text-body-sm text-text-secondary">{stockLabel}</p>

      <div className="mt-6">
        <p className="font-label-lg text-label-lg text-text-primary mb-2">Quantity</p>
        <div className="inline-flex items-center border border-border-default rounded-lg">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="w-10 h-10 flex items-center justify-center text-text-primary hover:bg-surface-secondary disabled:opacity-30 transition-colors"
          >
            −
          </button>
          <span className="w-10 text-center font-body-md text-body-md text-text-primary">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(selected?.stock ?? 99, q + 1))}
            disabled={!selected || quantity >= selected.stock}
            aria-label="Increase quantity"
            className="w-10 h-10 flex items-center justify-center text-text-primary hover:bg-surface-secondary disabled:opacity-30 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selected || selected.stock === 0}
          className="flex-1 py-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {added ? "Added ✓" : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={handleBuyItNow}
          disabled={!selected || selected.stock === 0}
          className="flex-1 py-4 rounded-xl border border-brand-primary text-brand-primary font-button text-button hover:bg-brand-primary/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Buy It Now
        </button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 pt-6 border-t border-border-default">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-brand-primary text-[20px]">local_shipping</span>
          <div>
            <p className="font-label-md text-label-md text-text-primary">Free shipping</p>
            <p className="font-label-md text-label-md text-text-secondary">on orders over $75</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-brand-primary text-[20px]">replay</span>
          <div>
            <p className="font-label-md text-label-md text-text-primary">Easy returns</p>
            <p className="font-label-md text-label-md text-text-secondary">60-day returns</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-brand-primary text-[20px]">verified_user</span>
          <div>
            <p className="font-label-md text-label-md text-text-primary">Secure checkout</p>
            <p className="font-label-md text-label-md text-text-secondary">Safe &amp; trusted</p>
          </div>
        </div>
      </div>
    </div>
  );
} 