"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------
 * Types — mirrors the payload from /api/campaign/active
 * ------------------------------------------------------------------ */
type FeatureItem = { icon: string; title: string; description: string };
type StatItem = { icon: string; number: string; description: string };
type Campaign = {
  collection_label: string;
  heading: string;
  subtitle: string;
  description: string;
  cta_text: string;
  cta_url: string;
  cta_visible: boolean;
  hero_product_image: string | null;
  hero_badge: string | null;
  lifestyle_image: string | null;
  feature_list: FeatureItem[];
  statistics: StatItem[];
  featured_heading: string;
  featured_description: string;
  featured_button_text: string;
  marquee_speed_seconds: number;
  marquee_direction: "left" | "right";
};
type Product = { id: number; name: string; image_url: string | null; category: string | null };
type TrustItem = { id: number; icon: string; heading: string; description: string };
type Testimonial = { name: string; image_url: string | null; rating: number; quote: string };
type CampaignPayload = {
  campaign: Campaign | null;
  featured_products: Product[];
  trust_items: TrustItem[];
  testimonials: Testimonial[];
};

/* ------------------------------------------------------------------
 * Fallbacks — only rendered before /api/campaign/active responds, or if
 * an admin hasn't configured a field yet.
 * ------------------------------------------------------------------ */
const FALLBACK_CAMPAIGN: Campaign = {
  collection_label: "AUTUMN 2026",
  heading: "Premium Denim",
  subtitle: "Made for Active Kids",
  description: "Crafted from the finest fabrics for comfort, durability & style.",
  cta_text: "Shop Collection",
  cta_url: "/products",
  cta_visible: true,
  hero_product_image: "https://picsum.photos/seed/tt-hero-product/500/650",
  hero_badge: "BEST SELLER",
  lifestyle_image: "https://picsum.photos/seed/tt-hero-lifestyle/700/900",
  feature_list: [
    { icon: "eco", title: "Premium Cotton", description: "" },
    { icon: "spa", title: "Soft on Skin", description: "" },
    { icon: "verified_user", title: "Built to Last", description: "" },
  ],
  statistics: [
    { icon: "group", number: "50,000+", description: "Happy Parents" },
    { icon: "checkroom", number: "200+", description: "Unique Designs" },
    { icon: "eco", number: "100%", description: "Premium Cotton" },
  ],
  featured_heading: "Featured Collection",
  featured_description: "Handpicked styles that kids love and parents trust.",
  featured_button_text: "Explore All",
  marquee_speed_seconds: 45,
  marquee_direction: "left",
};
const FALLBACK_PRODUCTS: Product[] = Array.from({ length: 8 }).map((_, i) => ({
  id: i,
  name: `Product ${i + 1}`,
  image_url: `https://picsum.photos/seed/tt-featured-${i}/400/500`,
  category: null,
}));
const FALLBACK_TRUST: TrustItem[] = [
  { id: 1, icon: "shield_check", heading: "Trusted by 50,000+ Parents", description: "Quality you can rely on" },
  { id: 2, icon: "eco", heading: "Premium Fabrics", description: "100% organic cotton" },
  { id: 3, icon: "local_shipping", heading: "Fast & Reliable Delivery", description: "Nationwide shipping" },
  { id: 4, icon: "spa", heading: "Soft on Sensitive Skin", description: "Gentle & comfortable" },
  { id: 5, icon: "sync_alt", heading: "Easy Returns & Exchanges", description: "Hassle-free returns" },
];
const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { name: "Ayesha M.", image_url: null, rating: 5, quote: "Amazing quality and perfect fit for my son. The fabric is so soft and comfortable!" },
  { name: "Zain R.", image_url: null, rating: 5, quote: "TinyTots never disappoints! Stylish, durable and my kids love wearing them." },
  { name: "Hina K.", image_url: null, rating: 5, quote: "Best kids' clothing shop in town — the staff always help me find the right size." },
];

const EDGE_FADE_MASK = "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)";

/* ------------------------------------------------------------------
 * Global keyframes
 * ------------------------------------------------------------------ */
function GlobalKeyframes() {
  return (
    <style jsx global>{`
      @keyframes marquee-left {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(-50%);
        }
      }
      @keyframes marquee-right {
        from {
          transform: translateX(-50%);
        }
        to {
          transform: translateX(0);
        }
      }
      @keyframes hero-float {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-14px);
        }
      }
      @keyframes stat-fade-in {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>
  );
}

/* ------------------------------------------------------------------
 * Header — logo only, no navigation
 * ------------------------------------------------------------------ */
function Header() {
  return (
    <div className="flex flex-col px-[2.5vw] pt-[2vh] shrink-0">
      <span className="font-display-md text-display-md text-primary font-extrabold tracking-tight leading-none">
        TinyTots
      </span>
      <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-[0.25em] mt-1">
        Premium Kids Wear
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------
 * Hero section
 * ------------------------------------------------------------------ */
function Hero({ campaign }: { campaign: Campaign }) {
  return (
    <div className="grid grid-cols-12 items-center gap-[1.5vw] px-[2.5vw] py-[2vh] flex-1 min-h-0">
      {/* Left: copy + CTA */}
      <div className="col-span-3 flex flex-col gap-3">
        <span className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-[0.3em]">
          {campaign.collection_label}
        </span>
        <h1 className="font-serif text-[clamp(2.5rem,4.2vw,4.5rem)] leading-[0.95] font-bold text-on-surface">
          {campaign.heading.split("\n").map((line, i) => (
            <span key={i} className={i === 1 ? "block text-primary" : "block"}>
              {line}
            </span>
          ))}
        </h1>
        <div className="h-[3px] w-10 bg-primary mt-1" />
        <span className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-[0.2em]">
          {campaign.subtitle}
        </span>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-[26ch]">{campaign.description}</p>
        {campaign.cta_visible && (
          <a
            href={campaign.cta_url}
            className="mt-2 inline-flex items-center gap-2 self-start bg-primary text-white font-label-lg text-label-lg font-semibold uppercase tracking-wide px-6 py-3 rounded-md"
          >
            {campaign.cta_text}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        )}
      </div>

      {/* Center: floating hero product + feature list */}
      <div className="col-span-5 relative flex items-center justify-center h-full">
        <div className="absolute w-[65%] aspect-square rounded-t-full bg-gradient-to-b from-surface-container-lowest to-transparent top-0" />
        <div className="absolute bottom-[8%] w-[55%] h-[6%] rounded-full bg-surface-container-lowest border border-outline-variant/30" />
        {campaign.hero_product_image && (
          <div
            className="relative z-10 w-[42%] aspect-[500/650]"
            style={{ animation: "hero-float 6s ease-in-out infinite" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={campaign.hero_product_image} alt="" className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
        )}
        {campaign.hero_badge && (
          <div className="absolute z-20 top-[12%] right-[14%] w-[13%] aspect-square rounded-full bg-surface border border-outline-variant/30 shadow-lg flex items-center justify-center text-center">
            <span className="font-label-sm text-label-sm font-bold text-primary uppercase leading-tight px-1">
              {campaign.hero_badge}
            </span>
          </div>
        )}
        {campaign.feature_list?.length > 0 && (
          <div className="absolute right-[2%] top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
            {campaign.feature_list.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">{f.icon}</span>
                <div className="leading-tight">
                  <p className="font-label-md text-label-md font-semibold text-on-surface uppercase whitespace-nowrap">
                    {f.title}
                  </p>
                  {f.description && <p className="font-body-sm text-body-sm text-on-surface-variant">{f.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lifestyle image */}
      <div className="col-span-2 h-full flex items-center justify-center">
        {campaign.lifestyle_image && (
          <div className="relative w-full h-[92%] rounded-[3rem] rounded-tr-[6rem] overflow-hidden shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={campaign.lifestyle_image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Statistics column */}
      {campaign.statistics?.length > 0 && (
        <div className="col-span-2 flex flex-col h-full justify-center gap-4">
          {campaign.statistics.map((s, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 ${i > 0 ? "pt-4 border-t border-outline-variant/25" : ""}`}
              style={{ animation: `stat-fade-in 0.6s ease-out ${i * 0.15}s both` }}
            >
              <span className="material-symbols-outlined text-primary text-[26px]">{s.icon}</span>
              <span className="font-headline-lg text-headline-lg font-extrabold text-on-surface leading-none">
                {s.number}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{s.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
 * Featured Collection — heading/CTA on the left, infinite product
 * marquee filling the rest of the row.
 * ------------------------------------------------------------------ */
function FeaturedCollection({ campaign, products }: { campaign: Campaign; products: Product[] }) {
  const list = products.length ? products : FALLBACK_PRODUCTS;
  const track = [...list, ...list];
  const direction = campaign.marquee_direction === "right" ? "marquee-right" : "marquee-left";
  const speed = campaign.marquee_speed_seconds || 45;

  return (
    <div className="flex items-center gap-[2vw] px-[2.5vw] py-[2.5vh] shrink-0">
      <div className="flex flex-col gap-2 w-[16vw] shrink-0">
        <h2 className="font-headline-lg text-headline-lg font-extrabold text-on-surface leading-tight">
          {campaign.featured_heading}
        </h2>
        <div className="h-[3px] w-8 bg-primary" />
        <p className="font-body-sm text-body-sm text-on-surface-variant">{campaign.featured_description}</p>
        <a
          href="/products"
          className="font-label-lg text-label-lg text-primary font-semibold uppercase tracking-wide inline-flex items-center gap-1 mt-1"
        >
          {campaign.featured_button_text}
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </a>
      </div>

      <div className="relative flex-1 overflow-hidden" style={{ WebkitMaskImage: EDGE_FADE_MASK, maskImage: EDGE_FADE_MASK }}>
        <div
          className="flex gap-4 w-max"
          style={{ animation: `${direction} ${speed}s linear infinite`, willChange: "transform" }}
        >
          {track.map((p, i) => (
            <div
              key={i}
              className="relative shrink-0 w-[11vw] aspect-[4/5] rounded-2xl overflow-hidden bg-surface-container-lowest border border-outline-variant/15"
            >
              {p.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-3" draggable={false} />
              )}
              <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface/90 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-primary">favorite_border</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * Trust strip
 * ------------------------------------------------------------------ */
function TrustStrip({ items }: { items: TrustItem[] }) {
  const list = items.length ? items : FALLBACK_TRUST;

  return (
    <div className="mx-[2.5vw] rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shrink-0">
      <div className="flex items-stretch">
        {list.map((item, i) => (
          <div
            key={item.id}
            className={`flex-1 flex items-center gap-3 px-5 py-4 ${i > 0 ? "border-l border-outline-variant/15" : ""}`}
          >
            <span className="material-symbols-outlined text-primary text-[26px] shrink-0">{item.icon}</span>
            <div className="leading-tight">
              <p className="font-label-md text-label-md font-bold text-on-surface uppercase">{item.heading}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * Testimonials — 2-up fade carousel with manual arrows + dots
 * ------------------------------------------------------------------ */
function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const list = testimonials.length ? testimonials : FALLBACK_TESTIMONIALS;
  const pairs: Testimonial[][] = [];
  for (let i = 0; i < list.length; i += 2) pairs.push(list.slice(i, i + 2));

  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pairs.length <= 1) return;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % pairs.length), 7000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pairs.length]);

  const go = (delta: number) => setIndex((i) => (i + delta + pairs.length) % pairs.length);
  const current = pairs[index] || [];

  return (
    <div className="flex flex-col items-center gap-4 px-[2.5vw] py-[2.5vh] shrink-0">
      <div className="flex items-center gap-3">
        <h2 className="font-label-lg text-label-lg font-bold text-on-surface uppercase tracking-[0.15em]">
          Loved by Parents
        </h2>
      </div>
      <div className="h-[2px] w-8 bg-primary -mt-2" />

      <div className="flex items-center gap-4 w-full max-w-5xl">
        <button
          onClick={() => go(-1)}
          className="shrink-0 w-9 h-9 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-lowest"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </button>

        <div className="flex-1 grid grid-cols-2 gap-4">
          {current.map((t, i) => (
            <div
              key={i}
              className="relative bg-surface-container-lowest border border-outline-variant/15 rounded-2xl px-5 py-4 flex items-start gap-3"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden bg-surface shrink-0">
                {t.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/15 text-primary font-bold">
                    {t.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex gap-0.5 mb-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <span
                      key={s}
                      className={`material-symbols-outlined text-[14px] ${s < t.rating ? "text-primary" : "text-outline-variant"}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="font-label-md text-label-md font-bold text-on-surface">{t.name}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{t.quote}</p>
              </div>
              <span className="material-symbols-outlined text-outline-variant/40 text-[28px] absolute top-3 right-3">
                format_quote
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => go(1)}
          className="shrink-0 w-9 h-9 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-lowest"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>

      {pairs.length > 1 && (
        <div className="flex gap-1.5">
          {pairs.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary" : "w-1.5 bg-outline-variant"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
 * Footer
 * ------------------------------------------------------------------ */
function Footer() {
  return (
    <div className="bg-[#3b241a] text-white flex items-center justify-between px-[2.5vw] py-[1.6vh] shrink-0">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">language</span>
        <span className="font-body-sm text-body-sm">www.tinytots.pk</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-label-md text-label-md font-semibold uppercase tracking-wide">Follow Us</span>
        {["instagram", "facebook", "pinterest"] ? null : null}
        {[
          { icon: "photo_camera", label: "Instagram" },
          { icon: "thumb_up", label: "Facebook" },
          { icon: "push_pin", label: "Pinterest" },
        ].map((s) => (
          <span key={s.label} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-label-md text-label-md font-semibold uppercase tracking-wide">Scan to Shop</span>
        <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px] text-[#3b241a]">qr_code_2</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------ */
export default function SignagePage() {
  const [data, setData] = useState<CampaignPayload | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/campaign/active")
        .then((res) => res.json())
        .then((json) => {
          if (!cancelled) setData(json);
        })
        .catch(() => {});
    };
    load();
    // Re-poll so a campaign switch (or edit to the active one) shows up on
    // the TV without a manual reload. A real campaign-switch fade (600-
    // 800ms) needs the OLD and NEW campaign content cross-dissolving —
    // see the note below on that piece being a follow-up.
    pollRef.current = setInterval(load, 2 * 60 * 1000);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const campaign = data?.campaign || FALLBACK_CAMPAIGN;
  const products = data?.featured_products || [];
  const trustItems = data?.trust_items || [];
  const testimonials = data?.testimonials || [];

  return (
    <div className="hide-scrollbar w-screen h-screen bg-[#faf5f0] flex flex-col overflow-hidden">
      <GlobalKeyframes />
      <Header />
      <Hero campaign={campaign} />
      <FeaturedCollection campaign={campaign} products={products} />
      <TrustStrip items={trustItems} />
      <Testimonials testimonials={testimonials} />
      <Footer />
    </div>
  );
}