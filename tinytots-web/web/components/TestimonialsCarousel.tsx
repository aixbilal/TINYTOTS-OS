"use client";

import { useEffect, useState } from "react";

interface Testimonial {
  id: number;
  customer_name: string;
  rating: number;
  quote: string;
}

export default function TestimonialsCarousel() {
  const [items, setItems] = useState<Testimonial[]>([]);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((res) => res.json())
      .then((json) => setItems(json.testimonials || []))
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mb-stack-lg">
      <h2 className="font-headline-lg text-on-surface mb-stack-md text-center">What Parents Are Saying</h2>
      <div className="flex gap-bento-gap overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
        {items.map((t) => (
          <div
            key={t.id}
            className="shrink-0 w-[85%] sm:w-[360px] snap-start rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 flex flex-col gap-3"
          >
            <div className="text-primary text-lg" aria-hidden="true">
              {"★".repeat(t.rating)}
              {"☆".repeat(5 - t.rating)}
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant italic">&ldquo;{t.quote}&rdquo;</p>
            <p className="font-label-lg text-label-lg text-on-surface font-semibold mt-auto">{t.customer_name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
