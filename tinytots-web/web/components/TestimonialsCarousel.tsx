"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Testimonial {
  id: number;
  customer_name: string;
  rating: number;
  quote: string;
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="shrink-0 w-[260px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 flex flex-col gap-2 mx-2">
      <div className="text-primary text-sm" aria-hidden="true">
        {"★".repeat(t.rating)}
        {"☆".repeat(5 - t.rating)}
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant italic line-clamp-3">&ldquo;{t.quote}&rdquo;</p>
      <p className="font-label-md text-label-md text-on-surface font-semibold mt-auto">{t.customer_name}</p>
    </div>
  );
}

// Continuously-scrolling strip, same seamless double-copy technique as the
// announcement bar ticker and the USP marquee — pauses on hover.
export default function TestimonialsCarousel() {
  const [items, setItems] = useState<Testimonial[]>([]);

  const load = useCallback(() => {
    fetch("/api/testimonials", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => setItems(json.testimonials || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("homepage-signage-revision")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "signage_revision", filter: "id=eq.1" },
        load
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  if (items.length === 0) return null;

  return (
    <section className="mb-stack-lg">
      <h2 className="font-headline-lg text-on-surface mb-stack-md text-center">What Parents Are Saying</h2>
      <div className="overflow-hidden py-2 group">
        <div className="flex w-max group-hover:[animation-play-state:paused]" style={{ animation: "marquee-loop 30s linear infinite" }}>
          <div className="flex shrink-0">
            {items.map((t) => (
              <TestimonialCard key={`a-${t.id}`} t={t} />
            ))}
          </div>
          <div className="flex shrink-0" aria-hidden="true">
            {items.map((t) => (
              <TestimonialCard key={`b-${t.id}`} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
