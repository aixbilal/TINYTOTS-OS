"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------
 * Placeholder fallbacks — only used if /api/signage returns nothing yet
 * (e.g. before any products/banners/testimonials exist). Everything else
 * below is real data from Supabase via /api/signage.
 * ------------------------------------------------------------------ */
const FALLBACK_PRODUCT_IMAGES = [
  "https://picsum.photos/seed/tt-fallback-1/500/650",
  "https://picsum.photos/seed/tt-fallback-2/500/650",
  "https://picsum.photos/seed/tt-fallback-3/500/650",
  "https://picsum.photos/seed/tt-fallback-4/500/650",
];
const FALLBACK_WORDS = ["Trust", "Care", "Quality", "Comfort"];
const FALLBACK_TESTIMONIALS = [
  { name: "Ayesha K.", rating: 5, quote: "The quality is amazing and the fabric is so soft on my daughter's skin. We keep coming back!" },
  { name: "Bilal R.", rating: 5, quote: "Best kids' clothing shop in town. The staff helped me find the perfect size in minutes." },
  { name: "Fatima S.", rating: 5, quote: "My son refuses to wear anything else now. TinyTots has become our go-to." },
];
const FALLBACK_BANNER = (label: string, seed: string) => [
  { image_url: `https://picsum.photos/seed/${seed}/700/700`, heading: label, subtext: "", link: "/products", display_seconds: 7 },
];

type Banner = { image_url: string; heading: string; subtext: string; link: string; display_seconds: number };
type BentoData = { meadow: Banner[]; boys: Banner[]; girls: Banner[]; collections: Banner[]; accessories: Banner[] };
type SignageData = {
  row1_images: string[];
  row2_images: string[];
  marquee_words: string[];
  bento: BentoData;
  testimonials: { name: string; rating: number; quote: string }[];
};

/* ------------------------------------------------------------------
 * Infinite marquee row of product images
 * ------------------------------------------------------------------ */
function ProductMarqueeRow({
  images,
  direction,
  durationSec,
}: {
  images: string[];
  direction: "left" | "right";
  durationSec: number;
}) {
  const list = images.length ? images : FALLBACK_PRODUCT_IMAGES;
  const track = [...list, ...list];

  return (
    <div className="relative w-full overflow-hidden">
      <motion.div
        className="flex gap-4 w-max"
        animate={{ x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ duration: durationSec, ease: "linear", repeat: Infinity }}
      >
        {track.map((src, i) => (
          <div
            key={i}
            className="relative shrink-0 h-[13vh] aspect-[500/650] rounded-xl overflow-hidden border border-outline-variant/20"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * Divider text marquee — revolving, editable word list, tastefully sized
 * ------------------------------------------------------------------ */
function TrustMarquee({ words }: { words: string[] }) {
  const list = words.length ? words : FALLBACK_WORDS;
  const track = [...list, ...list, ...list];

  return (
    <div className="relative w-full overflow-hidden py-[1vh] border-y border-outline-variant/20 bg-surface-container-lowest">
      <motion.div
        className="flex items-center gap-6 w-max"
        animate={{ x: ["0%", "-33.333%"] }}
        transition={{ duration: 18, ease: "linear", repeat: Infinity }}
      >
        {track.map((w, i) => (
          <span
            key={i}
            className="flex items-center gap-6 font-headline-sm text-headline-sm text-primary font-semibold whitespace-nowrap"
          >
            {w}
            <span className="text-outline-variant">•</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * A single bento tile: position/size is fixed, but it cycles through up
 * to 5 admin-defined banners, each with its own image, heading, subtext,
 * and display duration (5-10s) — the duration is re-read from the CURRENT
 * banner every time it advances, so mixed durations within one block work.
 * ------------------------------------------------------------------ */
function CrossfadeTile({ banners, className }: { banners: Banner[]; className: string }) {
  const list = banners.length ? banners : FALLBACK_BANNER("Coming Soon", className);
  const [index, setIndex] = useState(() => (list.length ? Math.floor(Math.random() * list.length) : 0));

  useEffect(() => {
    if (list.length <= 1) return;
    const current = list[index] || list[0];
    const ms = Math.min(10, Math.max(5, current.display_seconds || 7)) * 1000;
    const t = setTimeout(() => setIndex((i) => (i + 1) % list.length), ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, list.length]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-outline-variant/20 ${className}`}>
      {list.map((b, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={b.image_url + i}
          src={b.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === index ? 1 : 0 }}
          draggable={false}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {list[index]?.heading && (
          <p className="font-headline-md text-headline-md text-white font-bold drop-shadow-sm leading-tight">
            {list[index].heading}
          </p>
        )}
        {list[index]?.subtext && (
          <p className="font-body-sm text-body-sm text-white/85 mt-0.5 line-clamp-2">{list[index].subtext}</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * 5-section static bento grid — single row, asymmetric widths
 * ------------------------------------------------------------------ */
function BentoGrid({ bento }: { bento: BentoData }) {
  return (
    <div className="grid grid-cols-12 gap-4 w-full h-full">
      <CrossfadeTile banners={bento.meadow} className="col-span-3" />
      <CrossfadeTile banners={bento.boys} className="col-span-2" />
      <CrossfadeTile banners={bento.girls} className="col-span-2" />
      <CrossfadeTile banners={bento.collections} className="col-span-3" />
      <CrossfadeTile banners={bento.accessories} className="col-span-2" />
    </div>
  );
}

/* ------------------------------------------------------------------
 * Testimonials — continuous right-to-left marquee, edges fade via
 * mask-image so cards dissolve in/out instead of hard-cutting.
 * ------------------------------------------------------------------ */
function TestimonialsMarquee({ testimonials }: { testimonials: SignageData["testimonials"] }) {
  const list = testimonials.length ? testimonials : FALLBACK_TESTIMONIALS;
  const track = [...list, ...list];

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <motion.div
        className="flex items-center gap-4 h-full py-4 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 35, ease: "linear", repeat: Infinity }}
      >
        {track.map((t, i) => (
          <div
            key={i}
            className="shrink-0 w-[360px] h-full rounded-2xl bg-surface-container-lowest border border-outline-variant/20 px-5 py-3 flex flex-col justify-center"
          >
            <div className="flex gap-0.5 mb-1">
              {Array.from({ length: 5 }).map((_, s) => (
                <span
                  key={s}
                  className={`material-symbols-outlined text-[16px] ${s < t.rating ? "text-primary" : "text-outline-variant"}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              ))}
            </div>
            <p className="font-body-sm text-body-sm text-on-surface line-clamp-2">{t.quote}</p>
            <p className="font-label-md text-label-md text-primary font-semibold mt-1">{t.name}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------ */
export default function SignagePage() {
  const [data, setData] = useState<SignageData | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/signage")
        .then((res) => res.json())
        .then((json) => {
          if (!cancelled) setData(json);
        })
        .catch(() => {});
    };
    load();
    // Re-fetch every 10 minutes so admin content changes (new banners, new
    // marquee products, new testimonials, new trust words) show up without
    // reloading the TV.
    pollRef.current = setInterval(load, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const emptyBento: BentoData = { meadow: [], boys: [], girls: [], collections: [], accessories: [] };

  return (
    <div className="hide-scrollbar w-screen h-screen bg-surface flex flex-col overflow-hidden">
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Minimalist header — logo only, zero nav */}
      <div className="flex items-center justify-between px-[2vw] h-[7vh] shrink-0">
        <span className="font-display-sm text-display-sm text-primary tracking-tight">TinyTots</span>
        <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
          Premium Kids Wear
        </span>
      </div>

      {/* Dual product marquees */}
      <div className="flex flex-col gap-[1vh] shrink-0">
        <ProductMarqueeRow images={data?.row1_images || []} direction="left" durationSec={38} />
        <ProductMarqueeRow images={data?.row2_images || []} direction="right" durationSec={42} />
      </div>

      {/* Divider trust marquee */}
      <div className="shrink-0 mt-[1vh]">
        <TrustMarquee words={data?.marquee_words || []} />
      </div>

      {/* 5-block static bento, each crossfading through up to 5 custom banners */}
      <div className="flex-1 min-h-0 px-[2vw] py-[1.5vh]">
        <BentoGrid bento={data?.bento || emptyBento} />
      </div>

      {/* Testimonials */}
      <div className="h-[13vh] shrink-0 border-t border-outline-variant/20 bg-surface">
        <TestimonialsMarquee testimonials={data?.testimonials || []} />
      </div>
    </div>
  );
}