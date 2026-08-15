"use client";

import { useState } from "react";

interface Testimonial {
  id: number;
  customer_name: string;
  rating: number;
  quote: string;
}

const PAGE_SIZE = 3;

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="flex flex-col gap-3 bg-surface-elevated p-6">
      <span className="font-display-md text-[32px] leading-none text-brand-primary" aria-hidden="true">
        &ldquo;
      </span>
      <p className="font-body-md text-body-md text-text-secondary italic leading-relaxed -mt-4">
        {t.quote}
      </p>
      <p className="font-label-md text-label-md text-text-primary mt-1">&mdash; {t.customer_name}</p>
    </div>
  );
}

/**
 * Static, paginated (not infinite-scrolling) testimonial grid, per the
 * approved final spec: three cards per page with dot pagination. Data is
 * server-fetched on the homepage so this is in the first HTML.
 */
export default function TestimonialsCarousel({
  testimonials = [],
}: {
  testimonials?: Testimonial[];
}) {
  const [page, setPage] = useState(0);
  if (!testimonials.length) return null;

  const pageCount = Math.max(1, Math.ceil(testimonials.length / PAGE_SIZE));
  const current = testimonials.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="mb-stack-lg text-center">
      <h2 className="font-display-md text-[24px] md:text-[28px] text-text-primary tracking-tight mb-stack-md">
        Kind words from our TinyTots families
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-bento-gap text-left">
        {current.map((t) => (
          <TestimonialCard key={t.id} t={t} />
        ))}
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to testimonials page ${i + 1}`}
              aria-current={i === page ? true : undefined}
              onClick={() => setPage(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === page ? "w-6 bg-brand-primary" : "w-2 bg-border-default hover:bg-text-secondary"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
