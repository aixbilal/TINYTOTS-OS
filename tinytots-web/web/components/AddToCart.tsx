"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";

type Variant = {
  id: number;
  color: string | null;
  size: string | null;
  price: number;
  web_price: number | null;
  stock: number;
};

export default function AddToCart({
  productId,
  productName,
  variants,
}: {
  productId: number;
  productName: string;
  variants: Variant[];
}) {
  const { addItem } = useCart();
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [selected, setSelected] = useState<Variant | null>(firstAvailable ?? null);
  const [added, setAdded] = useState(false);

  function displayPrice(v: Variant) {
    return v.web_price ?? v.price;
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

  return (
    <div>
      {selected && (
        <p className="mt-2 font-headline-lg text-headline-lg text-primary">
          Rs. {displayPrice(selected).toLocaleString()}
        </p>
      )}

      <div className="mt-6">
        <p className="font-label-lg text-label-lg text-on-surface mb-2">Size / Variant</p>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v)}
              disabled={v.stock === 0}
              className={`px-4 py-2 rounded-lg border font-body-sm text-body-sm transition-colors ${
                selected?.id === v.id
                  ? "border-primary bg-primary-container text-on-primary"
                  : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
              } ${v.stock === 0 ? "opacity-30 cursor-not-allowed line-through" : ""}`}
            >
              {v.size ?? "One Size"}
              {v.color ? ` / ${v.color}` : ""}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 font-body-sm text-body-sm text-on-surface-variant">
        {selected
          ? selected.stock > 0
            ? `${selected.stock} in stock`
            : "Out of stock"
          : ""}
      </p>

      <button
        onClick={handleAddToCart}
        disabled={!selected || selected.stock === 0}
        className="mt-6 w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {added ? "Added ✓" : "Add to Cart"}
      </button>
    </div>
  );
}