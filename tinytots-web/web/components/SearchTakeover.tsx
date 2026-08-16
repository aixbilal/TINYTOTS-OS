"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

interface Product {
  id: number;
  name: string;
  brand: string | null;
  sku: string | null;
  category: string | null;
}

/**
 * Full-screen search: clicking the header search icon dims the whole page,
 * the nav bar hides (handled by the caller via onOpenChange), and this
 * takes over with a large, full-width input and live results below it.
 * Escape or clicking the backdrop closes it.
 */
export default function SearchTakeover({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [allProducts, setAllProducts] = useState<Product[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    if (allProducts) return;
    let cancelled = false;
    fetch("/api/products")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setAllProducts(json.data || []);
      })
      .catch(() => {
        if (!cancelled) setAllProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, allProducts]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const needle = query.trim().toLowerCase();
  const results = needle
    ? (allProducts || []).filter((p) =>
        [p.name, p.brand, p.sku, p.category].filter(Boolean).join(" ").toLowerCase().includes(needle)
      )
    : [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-24 md:pt-32 px-4"
          style={{ backgroundColor: "rgba(20,18,14,0.55)", backdropFilter: "blur(2px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
            className="w-full max-w-2xl"
          >
            <div className="flex items-center gap-3 bg-white rounded-full px-6 py-4 shadow-xl">
              <span className="material-symbols-outlined text-brand-primary shrink-0">search</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent outline-none border-none font-body-md text-body-md text-text-primary placeholder:text-text-secondary"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="shrink-0 w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {needle && (
              <div className="mt-3 bg-white rounded-2xl shadow-xl max-h-[60vh] overflow-y-auto p-2">
                {results.length === 0 ? (
                  <p className="font-body-sm text-body-sm text-text-secondary px-4 py-4">
                    No products found for &ldquo;{query}&rdquo;.
                  </p>
                ) : (
                  results.slice(0, 20).map((p) => (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      onClick={onClose}
                      className="flex justify-between px-4 py-3 rounded-xl hover:bg-surface-secondary font-body-sm text-body-sm text-text-primary transition-colors"
                    >
                      <span>{p.name}</span>
                      {p.brand && <span className="text-text-secondary">{p.brand}</span>}
                    </Link>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
