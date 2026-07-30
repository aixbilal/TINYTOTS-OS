"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface StackProduct {
  id: number;
  name: string;
  image_url: string | null;
  variants: { price: number; web_price: number | null }[];
}

// Adapted from the Vengeance UI "Testimonials Card" stacked-card pattern,
// populated with products instead of quotes: image stack on one side,
// name/price on the other, with prev/next + a counter.
export default function ProductStackCarousel({
  products,
  heading,
}: {
  products: StackProduct[];
  heading?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const rotations = useMemo(() => [4, -2, -9, 7], []);

  if (!products || products.length === 0) return null;

  const activeItem = products[activeIndex];
  const prices = activeItem.variants.map((v) => v.web_price ?? v.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;

  function goTo(next: number) {
    setDirection(next > activeIndex ? 1 : -1);
    setActiveIndex(next);
  }

  return (
    <section className="mb-stack-lg">
      {heading && <h2 className="font-headline-lg text-on-surface mb-stack-md text-center">{heading}</h2>}
      <div className="flex items-center justify-center">
        <div
          className="relative grid grid-cols-[1fr] md:grid-cols-[1fr_1fr] md:grid-rows-[auto_auto_auto] gap-x-8 gap-y-2 w-full"
          style={{ perspective: "1400px", maxWidth: "440px" }}
        >
          <div className="row-start-1 md:col-start-2 md:row-start-1 text-right font-mono text-sm text-on-surface-variant">
            {activeIndex + 1} / {products.length}
          </div>

          <div className="row-start-2 col-start-1 md:row-start-1 row-span-3 relative w-full aspect-square">
            <AnimatePresence custom={direction}>
              {products.map((item, index) => {
                const isActive = index === activeIndex;
                const offset = index - activeIndex;
                if (Math.abs(offset) > 2) return null; // only render nearby cards

                return (
                  <motion.div
                    key={item.id}
                    className="absolute inset-0 w-full h-full overflow-hidden border-[6px] bg-surface-container-lowest border-surface shadow-2xl rounded-lg"
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
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" draggable={false} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-sm">No image</div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="col-start-1 md:col-start-2 md:row-start-1 flex flex-col justify-center min-h-[120px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -25 }}
                transition={{ duration: 0.35 }}
              >
                <h3 className="font-headline-md text-headline-md text-on-surface">{activeItem.name}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">Rs. {minPrice.toLocaleString()}</p>
                <Link
                  href={`/products/${activeItem.id}`}
                  className="inline-block mt-3 font-button text-button text-primary hover:underline"
                >
                  View Product →
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

          {products.length > 1 && (
            <div className="col-start-1 md:col-start-2 md:row-start-3 flex gap-2 m-auto -mt-2 md:mt-4 md:m-0">
              <button
                disabled={activeIndex === 0}
                onClick={() => goTo(activeIndex - 1)}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-outline-variant/30 bg-surface transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low hover:scale-105"
                aria-label="Previous product"
              >
                <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
              </button>
              <button
                disabled={activeIndex === products.length - 1}
                onClick={() => goTo(activeIndex + 1)}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-outline-variant/30 bg-surface transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low hover:scale-105"
                aria-label="Next product"
              >
                <ArrowRight className="w-4 h-4 text-on-surface-variant" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
