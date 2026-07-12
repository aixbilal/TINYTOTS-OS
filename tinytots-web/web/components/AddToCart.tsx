"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";

type Variant = {
  id: number;
  color: string | null;
  size: string | null;
  price: number;
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

  function handleAddToCart() {
    if (!selected || selected.stock === 0) return;
    addItem(
      {
        variantId: selected.id,
        productId,
        productName,
        size: selected.size,
        color: selected.color,
        price: selected.price,
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
        <p className="mt-4 text-xl font-semibold text-black dark:text-white">
          Rs. {selected.price.toLocaleString()}
        </p>
      )}

      <div className="mt-6">
        <p className="text-sm font-medium text-black dark:text-white mb-2">
          Size
        </p>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v)}
              disabled={v.stock === 0}
              className={`px-4 py-2 rounded border text-sm ${
                selected?.id === v.id
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-zinc-300 dark:border-zinc-700"
              } ${
                v.stock === 0
                  ? "opacity-30 cursor-not-allowed line-through"
                  : ""
              }`}
            >
              {v.size ?? "One Size"}
              {v.color ? ` / ${v.color}` : ""}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-400">
        {selected
          ? selected.stock > 0
            ? `${selected.stock} in stock`
            : "Out of stock"
          : ""}
      </p>

      <button
        onClick={handleAddToCart}
        disabled={!selected || selected.stock === 0}
        className="mt-6 w-full py-3 rounded bg-black text-white dark:bg-white dark:text-black font-medium disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {added ? "Added ✓" : "Add to Cart"}
      </button>
    </div>
  );
}