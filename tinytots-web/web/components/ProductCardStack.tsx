"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  image_url: string | null;
  variants: { price: number; web_price: number | null; stock: number }[];
}

interface ProductCardStackProps {
  products: Product[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

// Adapted from a stacked-card testimonial pattern: rotated cards behind the
// active one, animated slide-in on change, prev/next + counter — showing
// products (image, name, price) instead of quotes.
export default function ProductCardStack({ products, autoPlay = true, autoPlayInterval = 3500 }: ProductCardStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const rotations = useMemo(() => [4, -2, -9, 7], []);

  useEffect(() => {
    if (!autoPlay || products.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % products.length);
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, products.length]);

  if (!products || products.length === 0) return null;

  const activeItem = products[activeIndex];
  const prices = activeItem.variants.map((v) => v.web_price ?? v.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;

  function goNext() {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % products.length);
  }
  function goPrev() {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + products.length) % products.length);
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-x-10 gap-y-4 w-full max-w-2xl"
        style={{ perspective: "1400px" }}
      >
        <div className="md:col-start-2 text-right font-mono text-sm text-on-surface-variant">
          {activeIndex + 1} / {products.length}
        </div>

        {/* Card stack */}
        <div className="col-start-1 md:row-start-1 row-span-3 relative w-full aspect-square">
          <AnimatePresence custom={direction}>
            {products.map((product, index) => {
              const isActive = index === activeIndex;
              const offset = index - activeIndex;
              if (Math.abs(offset) > 2 && !isActive) return null; // keep DOM light

              return (
                <motion.div
                  key={product.id}
                  className="absolute inset-0 w-full h-full overflow-hidden border-[6px] bg-surface-container border-surface shadow-2xl rounded-2xl"
                  initial={{
                    x: offset * 15,
                    y: Math.abs(offset) * 6,
                    scale: 0.85 - Math.abs(offset) * 0.04,
                    rotateZ: rotations[index % 4],
                    opacity: isActive ? 1 : 0.5,
                    zIndex: 10 - Math.abs(offset),
                  }}
                  animate={
                    isActive
                      ? {
                          x: [offset * 15, direction === 1 ? -80 : 80, 0],
                          y: [Math.abs(offset) * 6, 0, 0],
                          scale: [0.85, 1.05, 1],
                          rotateZ: [rotations[index % 4], -5, 0],
                          opacity: 1,
                          zIndex: 100,
                        }
                      : {
                          x: offset * 15,
                          y: Math.abs(offset) * 6,
                          rotateZ: rotations[index % 4],
                          scale: 0.85 - Math.abs(offset) * 0.04,
                          opacity: 0.55,
                          zIndex: 10 - Math.abs(offset),
                        }
                  }
                  exit={{
                    x: direction === 1 ? -120 : 120,
                    scale: 0.75,
                    rotateZ: direction === 1 ? -10 : 10,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 70vw, 320px"
                      className="object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center text-on-surface-variant text-sm">
                      No image
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Text area */}
        <div className="col-start-1 md:col-start-2 md:row-start-1 flex flex-col justify-center min-h-[120px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-headline-lg text-headline-lg text-on-surface">{activeItem.name}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">Rs. {minPrice.toLocaleString()}</p>
              <Link
                href={`/products/${activeItem.id}`}
                className="inline-block mt-4 font-button text-button px-5 py-2 rounded-full bg-primary-container text-on-primary hover:bg-primary transition-colors"
              >
                View Product
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nav */}
        {products.length > 1 && (
          <div className="col-start-1 md:col-start-2 md:row-start-3 flex gap-2">
            <button
              onClick={goPrev}
              aria-label="Previous product"
              className="flex items-center justify-center w-10 h-10 rounded-full border border-outline-variant/40 bg-surface hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_left</span>
            </button>
            <button
              onClick={goNext}
              aria-label="Next product"
              className="flex items-center justify-center w-10 h-10 rounded-full border border-outline-variant/40 bg-surface hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
