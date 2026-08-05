"use client";

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
      <p
        className="font-body-sm text-on-surface-variant italic overflow-hidden"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          lineHeight: 1.5,
        }}
      >
        &ldquo;{t.quote}&rdquo;
      </p>
      <p className="font-label-md text-label-md text-on-surface font-semibold mt-auto">
        {t.customer_name}
      </p>
    </div>
  );
}

/**
 * Presentational marquee — data is server-fetched on the homepage so the
 * section is in the first HTML (no CLS from client fetch) and we avoid
 * shipping @supabase/supabase-js + realtime on /.
 */
export default function TestimonialsCarousel({
  testimonials = [],
}: {
  testimonials?: Testimonial[];
}) {
  if (!testimonials.length) return null;

  return (
    <section className="mb-stack-lg">
      <h2 className="font-headline-lg text-on-surface mb-stack-md text-center">
        What Parents Are Saying
      </h2>
      <div
      className="relative w-screen max-w-[100vw] left-1/2 -translate-x-1/2 overflow-hidden py-2 group"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 48px, black calc(100% - 48px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 48px, black calc(100% - 48px), transparent 100%)",
      }}
    >
        <div
          className="flex w-max group-hover:[animation-play-state:paused]"
          style={{ animation: "marquee-loop 30s linear infinite" }}
        >
          <div className="flex shrink-0">
            {testimonials.map((t) => (
              <TestimonialCard key={`a-${t.id}`} t={t} />
            ))}
          </div>
          <div className="flex shrink-0" aria-hidden="true">
            {testimonials.map((t) => (
              <TestimonialCard key={`b-${t.id}`} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
