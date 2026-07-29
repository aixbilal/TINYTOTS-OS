"use client";

import { useEffect, useRef, useState } from "react";

interface Testimonial {
  id: number;
  customer_name: string;
  rating: number;
  quote: string;
}

const AUTO_ADVANCE_MS = 4000;

export default function TestimonialsCarousel() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((res) => res.json())
      .then((json) => setItems(json.testimonials || []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length]);

  if (items.length === 0) return null;

  // Show up to 3 tiles at a time on desktop, sliding through in a loop;
  // on mobile it's effectively one at a time since the tiles are wide.
  const visibleCount = Math.min(3, items.length);
  const visible = Array.from({ length: visibleCount }, (_, i) => items[(index + i) % items.length]);

  return (
    <section className="mb-stack-lg">
      <h2 className="font-headline-lg text-on-surface mb-stack-md text-center">What Parents Are Saying</h2>
      <div className="flex gap-4 justify-center overflow-hidden px-2">
        {visible.map((t, i) => (
          <div
            key={`${t.id}-${index}-${i}`}
            className="w-[260px] shrink-0 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 flex flex-col gap-2 transition-all duration-500 ease-in-out"
          >
            <div className="text-primary text-sm" aria-hidden="true">
              {"★".repeat(t.rating)}
              {"☆".repeat(5 - t.rating)}
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant italic line-clamp-3">&ldquo;{t.quote}&rdquo;</p>
            <p className="font-label-md text-label-md text-on-surface font-semibold mt-auto">{t.customer_name}</p>
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-primary" : "bg-outline-variant/40"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
