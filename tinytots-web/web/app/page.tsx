import type { Metadata } from "next";
import Image from "next/image";
import dynamic from "next/dynamic";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { supabaseAnon as supabase } from "@/lib/supabase-anon";
import Link from "next/link";
import ProductCarouselTabs from "@/components/ProductCarouselTabs";
import HomepageHero from "@/components/HomepageHero";
import HeroLcpPreload from "@/components/HeroLcpPreload";
import { resolveHeroSlides } from "@/lib/hero-slides";
import { absoluteUrl } from "@/lib/site-url";

// ISR: keep homepage fresh for admin edits without force-dynamic TTFB hit on every request.
// 60s is a good balance for stock/price/image updates vs PageSpeed LCP.
export const revalidate = 60;

// Pakistan / South Asia traffic: avoid regenerating from US-East (iad1) on STALE misses.
export const preferredRegion = ["sin1", "bom1", "hnd1"];

// Heavy client islands — code-split so framer-motion / supabase realtime stay off the critical path.
const TestimonialsCarousel = dynamic(() => import("@/components/TestimonialsCarousel"));

const HOME_TITLE = "TinyTots | Premium Kids Clothing";
const HOME_DESCRIPTION =
  "Ethically crafted, modern essentials for every stage of your child's early journey. Soft, durable kids clothing with free delivery and easy 7-day returns.";

const PRODUCT_SELECT = `
  id,
  name,
  sku,
  brand,
  image_url,
  product_images ( storage_path, is_primary, sort_order ),
  variants (
    id,
    color,
    color_hex,
    price,
    web_price,
    stock
  )
`;

function withSecondaryImage(products: any[]) {
  return (products || []).map((p) => {
    const gallery = (p.product_images || [])
      .filter((img: any) => !img.is_primary)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);
    const secondary = gallery[0]
      ? supabase.storage.from("product-images").getPublicUrl(gallery[0].storage_path).data.publicUrl
      : null;
    const { product_images, ...rest } = p;
    return { ...rest, secondary_image_url: secondary };
  });
}

async function getProducts(productIds: number[] | null | undefined) {
  if (productIds && productIds.length > 0) {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .in("id", productIds);

    if (!error && data && data.length > 0) {
      // Preserve the admin-chosen order rather than whatever order Postgres returns.
      const byId = new Map(withSecondaryImage(data).map((p: any) => [p.id, p]));
      return productIds.map((id) => byId.get(id)).filter(Boolean);
    }
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) return [];
  return withSecondaryImage(data);
}

async function getProductsForSection(
  selectionType: string | null | undefined,
  category: string | null | undefined,
  productIds: number[] | null | undefined
) {
  if (selectionType === "category" && category) {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .eq("category", category)
      .order("created_at", { ascending: false })
      .limit(12);
    if (error || !data) return [];
    return withSecondaryImage(data);
  }
  return getProducts(productIds);
}

const DEFAULT_TRUST_ITEMS = [
  { icon: "payments", label: "Cash on Delivery Available" },
  { icon: "local_shipping", label: "Free Delivery on All Orders" },
  { icon: "replay", label: "Easy 7-Day Returns" },
];

const HOMEPAGE_DEFAULTS = {
  hero_image_url:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDcHOEBpwtxoe3pT3NNiOQoUlZSPXHZXzjeoQOBkGcnwMqk8LNEfS_BLaNFvbDX-hie2mEl7T0RXcYZiRo62Rvdf50WGU9U4BD5oXHj7_E-gwRRFNXsBN-fTWavIdwpKxC17urnpJTVwBoPKRa1I79HkhFnqTLljxe6--Z6Hlwkbqweez3itoFTvxizLNFwL3tMrsZt3LeJQ-PBMbb1EiJJB23UvYLpk3iw905UJTcODCR79jbCm2P_w_RYfYB_hiR-KWOI441C-kke",
  hero_image_url_mobile: "",
  hero_video_url: "",
  hero_headline: "Playful Designs for Little Pioneers",
  hero_subtext: "Ethically crafted, modern essentials for every stage of your child's early journey.",
  hero_button_text: "Shop New Arrivals",
  hero_button_link: "#trending",
  trending_heading: "Loved by little ones",
  trust_items: DEFAULT_TRUST_ITEMS,
  usp_heading: "Why Choose TinyTots",
  meadow_image_url:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD8Kx1YOh37r9_tpddrRx-z8ThyZ74VSqpZ8NqUnuAkyKpMprUo6QvWwqSSsEAdqYjmB8_VspVcq243mW9a22_3h2uBkoj0HsGYa9zMowQLOW9MHk0XF5DbcrXkdkT-N_-7h5kT9AGG2BKHkZ6lR4Z-1-JuIolvhibU6NmMriHSQUJDGTJf97EnY-lHUWEAB0lC50ARUK0xVIRuln4l0asI6-ON9Q36p900XcyxhlFoKFDQGDSKpihL40rJhWsAylmx-xlFJabMaUOM",
  meadow_badge_text: "Spring Collection",
  meadow_heading: "Soft Pastels Edit",
  meadow_button_text: "Explore Collection",
  meadow_link: "/products",
  boys_image_url:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBOxH5NNX2M4TZ_MpabUd6iR43Lqhl4mFUPL1vygsT6U1bIZ5Wap_3XSxsXwMWuTpJtQjGi1xQUQ0xlBJTfeIdLJbliy7pXKJo4yrKNaOC-9z47-0vKeKtG0yMUAieIJkIQzShvCusjWv4HMiprijPupQmRH7maK_H1bGvYeJOQPSB6-Vvc2ST4xCIh72JtiSddsb8tEqrSymHPvPcFy4cFJ4xxnkl7A9vkWZEQ12bIJVnmM-Pu-aPA1yPpjf6jsWkS9BLBw74821_i",
  boys_heading: "Boys",
  boys_button_text: "Shop Now",
  boys_link: "/products",
  girls_image_url:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAex1tG2uv7lMIPIdDrPkL8txTXP-5lNjCD9jng7kNs6OcH_Ky94n8BWlY6cuBw71fG3Y01Wk_cRUvqnae2Q0zgpo5_zC77fJXWem1322uBxd60gIILFisAPS8wpWKA21VbKHRG7-aJ41OJBfx8Za033flnWypc0wBXWIfw6Z0DtvlSFrUpW0waIQ7CT6yae7FvGXNj0ydtDn_RlUQCdvs-59xozzxbXO0S77lPanQ7IV2gjCXPsPIhHgv2Vr3i3DLgN9EgUgj0WR_s",
  girls_heading: "Girls",
  girls_button_text: "Shop Now",
  girls_link: "/products",
  new_arrivals_image_url: "/images/homepage/new-arrivals-tile.webp",
  new_arrivals_heading: "New Arrivals",
  new_arrivals_button_text: "Shop New In",
  new_arrivals_link: "/products?sort=newest",
  editorial_eyebrow: "Made With Heart",
  editorial_headline: "Designed with love. Made for childhood.",
  editorial_body:
    "Every piece is crafted from premium natural fabrics with gentle details and timeless silhouettes - made to be worn, loved, and passed down.",
  editorial_image_url: "/images/homepage/editorial-story-01.webp",
  editorial_cta_text: "Our Story",
  editorial_cta_link: "/our-story",
  lifestyle_1_eyebrow: "Rooted In Quality",
  lifestyle_1_headline: "Beautiful pieces for real life.",
  lifestyle_1_body: "We believe in slow fashion, lasting quality, and the little details that make a big difference.",
  lifestyle_1_image_url: "/images/homepage/lifestyle-support.webp",
  lifestyle_1_cta_text: "Learn More",
  lifestyle_1_cta_link: "/our-story",
  lifestyle_2_eyebrow: "Made For Together",
  lifestyle_2_headline: "For the moments that matter.",
  lifestyle_2_body: "From everyday adventures to memory-making days - we're here for it all.",
  lifestyle_2_image_url: "/images/homepage/brand-story-support.webp",
  lifestyle_2_cta_text: "Explore More",
  lifestyle_2_cta_link: "/products",
  closing_cta_image_url: "/images/homepage/cta-closing-visual.webp",
  closing_cta_headline: "Made to be memories. Beautiful always.",
  closing_cta_subtext: "Styles today. Memories forever.",
  closing_cta_button_text: "Shop the Collection",
  closing_cta_button_link: "/products",
  usp_items: [
    { icon: "eco", title: "Ethically Sourced", description: "Every piece is made with responsibly sourced, child-safe materials." },
    { icon: "verified", title: "Certified Safe", description: "Fabrics tested and certified for sensitive skin." },
    { icon: "shield", title: "Built to Last", description: "Reinforced seams and stitching made for real play." },
    { icon: "local_shipping", title: "Easy Returns", description: "7-day hassle-free returns on every order." },
  ],
};

const fetchHomepageContent = async () => {
  const { data } = await supabase.from("homepage_content").select("*").eq("id", 1).single();
  return data || HOMEPAGE_DEFAULTS;
};

// Cross-request cache for ISR regenerations (React cache() only dedupes within one render).
const getHomepageContentCached = unstable_cache(fetchHomepageContent, ["homepage-content"], {
  revalidate: 60,
});

const getHomepageContent = cache(getHomepageContentCached);

export async function generateMetadata(): Promise<Metadata> {
  const content = await getHomepageContent();
  const slides = resolveHeroSlides(content);
  const ogImage =
    slides[0]?.image_url ||
    content.hero_image_url ||
    HOMEPAGE_DEFAULTS.hero_image_url;

  return {
    title: { absolute: HOME_TITLE },
    description: HOME_DESCRIPTION,
    alternates: { canonical: absoluteUrl("/") },
    openGraph: {
      type: "website",
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      url: absoluteUrl("/"),
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: "TinyTots" }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

function sectionLink(
  selectionType: string | null | undefined,
  category: string | null | undefined,
  productIds: number[] | null | undefined,
  fallbackLink: string
) {
  if (selectionType === "category" && category) return `/collections/${category}`;
  if (selectionType === "products" && productIds && productIds.length > 0) {
    return `/products?ids=${productIds.join(",")}`;
  }
  return fallbackLink;
}

function resolveTrustItems(raw: unknown) {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_TRUST_ITEMS;
  const items = raw
    .filter((item): item is { icon?: string; label?: string } => !!item && typeof item === "object")
    .map((item) => ({
      icon: String(item.icon || "verified").trim() || "verified",
      label: String(item.label || "").trim(),
    }))
    .filter((item) => item.label.length > 0);
  return items.length > 0 ? items : DEFAULT_TRUST_ITEMS;
}

async function getHomepageTestimonials() {
  // Mirror /api/testimonials without .single() — multi-active campaigns return many rows.
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("testimonial_ids")
    .eq("is_active", true);
  const ids = [
    ...new Set(
      (campaigns || []).flatMap((c: { testimonial_ids?: number[] | null }) =>
        Array.isArray(c.testimonial_ids) ? c.testimonial_ids : []
      )
    ),
  ];
  if (!ids.length) return [];
  const { data } = await supabase
    .from("testimonials")
    .select("id, customer_name, rating, quote")
    .in("id", ids)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return data || [];
}

const getHomepageSections = unstable_cache(
  async (
    trendingSelectionType: string | null | undefined,
    trendingCategory: string | null | undefined,
    trendingProductIds: number[] | null | undefined
  ) => {
    const [trendingProducts, testimonials] = await Promise.all([
      getProductsForSection(trendingSelectionType, trendingCategory, trendingProductIds),
      getHomepageTestimonials(),
    ]);
    return { trendingProducts, testimonials };
  },
  ["homepage-sections"],
  { revalidate: 60 }
);

export default async function Home() {
  const content = await getHomepageContent();
  const { trendingProducts, testimonials } = await getHomepageSections(
    content.trending_selection_type,
    content.trending_category,
    content.trending_product_ids
  );

  const heroSlides = resolveHeroSlides(content);
  const lcpSlide = heroSlides[0];
  const trustItems = resolveTrustItems(content.trust_items);
  const uspItems =
    content.usp_items && content.usp_items.length > 0 ? content.usp_items : HOMEPAGE_DEFAULTS.usp_items;
  const trendingHeading = content.trending_heading || HOMEPAGE_DEFAULTS.trending_heading;

  return (
    <>
      {lcpSlide && (
        <HeroLcpPreload
          desktopUrl={lcpSlide.image_url || lcpSlide.image_url_mobile}
          mobileUrl={lcpSlide.image_url_mobile || lcpSlide.image_url}
        />
      )}
      <HomepageHero slides={heroSlides} />

      <div className="max-w-container-max mx-auto px-5 md:px-16 md:px-margin-desktop px-margin-mobile">
        {trustItems.length > 0 && (
          <section className="w-full border-t border-b border-border-default py-4 mb-stack-lg bg-surface-elevated">
            <div className="flex flex-wrap md:flex-nowrap justify-center md:justify-between items-center gap-6 px-4">
              {trustItems.map((item, i) => (
                <div key={`${item.label}-${i}`} className="contents">
                  {i > 0 && <div className="hidden md:block w-px h-6 bg-border-default" />}
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-brand-primary">{item.icon}</span>
                    <span className="font-label-md text-label-md text-text-secondary uppercase">
                      {item.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section id="trending" className="mb-stack-lg">
          <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-2 block">
            Trending Now
          </span>
          <h2 className="font-display-md text-[32px] md:text-[48px] text-text-primary tracking-tight mb-stack-md">
            {trendingHeading}
          </h2>
          <ProductCarouselTabs
            hideHeading
            layout="scroll"
            tabs={[
              {
                key: "trending",
                label: trendingHeading,
                products: trendingProducts as any,
              },
            ]}
          />
        </section>

        {/* Editorial story: "Designed with love. Made for childhood." */}
        <section className="relative w-screen left-1/2 -translate-x-1/2 mb-stack-lg grid grid-cols-1 md:grid-cols-2 gap-bento-gap items-stretch">
          <div className="relative rounded-none overflow-hidden min-h-[280px] md:min-h-[400px]">
            <Image
              src={content.editorial_image_url || HOMEPAGE_DEFAULTS.editorial_image_url}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="relative flex flex-col justify-center bg-brand-primary/[0.18] px-6 py-10 md:px-12 overflow-hidden">
            <svg
              className="absolute bottom-0 right-0 w-32 md:w-44 h-auto text-brand-primary/20 pointer-events-none"
              viewBox="0 0 160 200"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              aria-hidden="true"
            >
              <path d="M80 200 V60" />
              <path d="M80 130 C55 120 45 95 55 70" />
              <path d="M80 100 C105 90 115 65 105 40" />
              <path d="M80 75 C60 65 55 45 65 25" />
              <ellipse cx="52" cy="66" rx="9" ry="14" transform="rotate(-30 52 66)" />
              <ellipse cx="103" cy="37" rx="9" ry="14" transform="rotate(25 103 37)" />
              <ellipse cx="63" cy="22" rx="8" ry="12" transform="rotate(-15 63 22)" />
              <circle cx="80" cy="55" r="4" />
            </svg>
            <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-3">
              {content.editorial_eyebrow || HOMEPAGE_DEFAULTS.editorial_eyebrow}
            </span>
            <h2 className="font-display-md text-[28px] md:text-[36px] text-text-primary tracking-tight mb-4 max-w-md">
              {content.editorial_headline || HOMEPAGE_DEFAULTS.editorial_headline}
            </h2>
            <p className="font-body-md text-body-md text-text-secondary mb-6 max-w-sm leading-relaxed">
              {content.editorial_body || HOMEPAGE_DEFAULTS.editorial_body}
            </p>
            <Link
              href={content.editorial_cta_link || HOMEPAGE_DEFAULTS.editorial_cta_link}
              className="inline-flex items-center justify-center bg-brand-primary text-white font-button text-button h-11 px-6 w-fit hover:opacity-90 transition-opacity duration-300 relative z-10"
            >
              {content.editorial_cta_text || HOMEPAGE_DEFAULTS.editorial_cta_text}
            </Link>
          </div>
        </section>

        {/* Girls / Boys / New Arrivals — three equal collection cards.
            Full-bleed with padding equal to the inter-tile gap, so the
            edge-to-tile spacing matches the tile-to-tile spacing exactly. */}
        <section className="relative w-screen left-1/2 -translate-x-1/2 mb-stack-lg px-bento-gap">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-bento-gap">
            <Link
              href="/products?gender=girl"
              className="relative aspect-[3/2] overflow-hidden group cursor-pointer"
            >
              <Image
                src={content.girls_image_url ?? HOMEPAGE_DEFAULTS.girls_image_url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors duration-300" />
              <div className="absolute bottom-5 left-5 z-10">
                <h3 className="font-headline-md text-headline-md text-white mb-1">
                  {content.girls_heading || HOMEPAGE_DEFAULTS.girls_heading}
                </h3>
                <p className="text-white/85 font-body-sm text-body-sm mb-3">Soft, pretty &amp; made to twirl</p>
                <span className="inline-flex items-center bg-white text-text-primary font-button text-button px-4 py-2">
                  {content.girls_button_text || HOMEPAGE_DEFAULTS.girls_button_text}
                </span>
              </div>
            </Link>
            <Link
              href="/products?gender=boy"
              className="relative aspect-[3/2] overflow-hidden group cursor-pointer"
            >
              <Image
                src={content.boys_image_url ?? HOMEPAGE_DEFAULTS.boys_image_url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors duration-300" />
              <div className="absolute bottom-5 left-5 z-10">
                <h3 className="font-headline-md text-headline-md text-white mb-1">
                  {content.boys_heading || HOMEPAGE_DEFAULTS.boys_heading}
                </h3>
                <p className="text-white/85 font-body-sm text-body-sm mb-3">Cool, comfortable &amp; adventure ready</p>
                <span className="inline-flex items-center bg-white text-text-primary font-button text-button px-4 py-2">
                  {content.boys_button_text || HOMEPAGE_DEFAULTS.boys_button_text}
                </span>
              </div>
            </Link>
            <Link
              href={sectionLink(
                content.new_arrivals_selection_type,
                content.new_arrivals_category,
                content.new_arrivals_product_ids,
                content.new_arrivals_link ?? HOMEPAGE_DEFAULTS.new_arrivals_link
              )}
              className="relative aspect-[3/2] overflow-hidden group cursor-pointer"
            >
              <Image
                src={content.new_arrivals_image_url ?? HOMEPAGE_DEFAULTS.new_arrivals_image_url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors duration-300" />
              <div className="absolute bottom-5 left-5 z-10">
                <h3 className="font-headline-md text-headline-md text-white mb-1">
                  {content.new_arrivals_heading || HOMEPAGE_DEFAULTS.new_arrivals_heading}
                </h3>
                <p className="text-white/85 font-body-sm text-body-sm mb-3">The latest pieces to love</p>
                <span className="inline-flex items-center bg-white text-text-primary font-button text-button px-4 py-2">
                  {content.new_arrivals_button_text || HOMEPAGE_DEFAULTS.new_arrivals_button_text}
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* Spring Moments — full-width seasonal campaign banner */}
        <Link
          href={sectionLink(
            content.meadow_selection_type,
            content.meadow_category,
            content.meadow_product_ids,
            content.meadow_link ?? HOMEPAGE_DEFAULTS.meadow_link
          )}
          className="relative w-screen left-1/2 -translate-x-1/2 flex flex-col md:flex-row mb-stack-lg overflow-hidden group cursor-pointer bg-surface-elevated"
        >
          {/* Mobile: plain text panel above the image, no overlay needed for legibility */}
          <div className="md:hidden flex flex-col justify-center px-6 py-8">
            <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-3">
              {content.meadow_badge_text ?? HOMEPAGE_DEFAULTS.meadow_badge_text}
            </span>
            <h3 className="font-display-md text-[26px] text-text-primary tracking-tight mb-4">
              {content.meadow_heading ?? HOMEPAGE_DEFAULTS.meadow_heading}
            </h3>
            <span className="inline-flex items-center justify-center bg-brand-primary text-white font-button text-button h-11 px-6 w-fit hover:opacity-90 transition-opacity duration-300">
              {content.meadow_button_text ?? HOMEPAGE_DEFAULTS.meadow_button_text}
            </span>
          </div>
          <div className="relative w-full aspect-[4/3] md:aspect-auto md:min-h-[360px]">
            <Image
              src={content.meadow_image_url ?? HOMEPAGE_DEFAULTS.meadow_image_url}
              alt=""
              fill
              sizes="100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Desktop: gradient + overlaid text panel, enough pixel-width at desktop
                breakpoints for the fade to clear the text before it hits busy photo. */}
            <div
              className="hidden md:block absolute inset-0"
              style={{
                background: "linear-gradient(to right, rgba(250,247,242,0.95) 0%, rgba(250,247,242,0.55) 45%, rgba(250,247,242,0) 70%)",
              }}
            />
            <div className="hidden md:flex relative z-10 flex-col justify-center h-full px-14 max-w-md">
              <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-3">
                {content.meadow_badge_text ?? HOMEPAGE_DEFAULTS.meadow_badge_text}
              </span>
              <h3 className="font-display-md text-[36px] text-text-primary tracking-tight mb-4">
                {content.meadow_heading ?? HOMEPAGE_DEFAULTS.meadow_heading}
              </h3>
              <span className="inline-flex items-center justify-center bg-brand-primary text-white font-button text-button h-11 px-6 w-fit hover:opacity-90 transition-opacity duration-300">
                {content.meadow_button_text ?? HOMEPAGE_DEFAULTS.meadow_button_text}
              </span>
            </div>
          </div>
        </Link>


        {/* Two supporting lifestyle/brand editorial modules - small image
            tile + flat text panel side by side per module (per your
            reference screenshot), no gradient/overlay - reverted back to
            this after two wrong turns (mask-fade, then full-overlay). */}
        <section className="mb-stack-lg grid grid-cols-1 md:grid-cols-2 gap-bento-gap">
          <div className="flex flex-col sm:flex-row items-stretch bg-brand-primary/[0.06]">
            <div className="relative w-full sm:w-[45%] aspect-[4/5] sm:aspect-auto shrink-0">
              <Image
                src={content.lifestyle_1_image_url || HOMEPAGE_DEFAULTS.lifestyle_1_image_url}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center px-6 py-8">
              <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-2">
                {content.lifestyle_1_eyebrow || HOMEPAGE_DEFAULTS.lifestyle_1_eyebrow}
              </span>
              <h3 className="font-display-md text-[22px] md:text-[26px] text-text-primary tracking-tight mb-3">
                {content.lifestyle_1_headline || HOMEPAGE_DEFAULTS.lifestyle_1_headline}
              </h3>
              <p className="font-body-sm text-body-sm text-text-secondary mb-4 leading-relaxed">
                {content.lifestyle_1_body || HOMEPAGE_DEFAULTS.lifestyle_1_body}
              </p>
              <Link
                href={content.lifestyle_1_cta_link || HOMEPAGE_DEFAULTS.lifestyle_1_cta_link}
                className="inline-flex items-center font-button text-button text-text-primary hover:underline underline-offset-4 w-fit"
              >
                {content.lifestyle_1_cta_text || HOMEPAGE_DEFAULTS.lifestyle_1_cta_text}
                <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
              </Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch bg-brand-primary/[0.06]">
            <div className="relative w-full sm:w-[45%] aspect-[4/5] sm:aspect-auto shrink-0">
              <Image
                src={content.lifestyle_2_image_url || HOMEPAGE_DEFAULTS.lifestyle_2_image_url}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center px-6 py-8">
              <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-2">
                {content.lifestyle_2_eyebrow || HOMEPAGE_DEFAULTS.lifestyle_2_eyebrow}
              </span>
              <h3 className="font-display-md text-[22px] md:text-[26px] text-text-primary tracking-tight mb-3">
                {content.lifestyle_2_headline || HOMEPAGE_DEFAULTS.lifestyle_2_headline}
              </h3>
              <p className="font-body-sm text-body-sm text-text-secondary mb-4 leading-relaxed">
                {content.lifestyle_2_body || HOMEPAGE_DEFAULTS.lifestyle_2_body}
              </p>
              <Link
                href={content.lifestyle_2_cta_link || HOMEPAGE_DEFAULTS.lifestyle_2_cta_link}
                className="inline-flex items-center font-button text-button text-text-primary hover:underline underline-offset-4 w-fit"
              >
                {content.lifestyle_2_cta_text || HOMEPAGE_DEFAULTS.lifestyle_2_cta_text}
                <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {uspItems.length > 0 && (
          <section className="mb-stack-lg text-center">
            <h2 className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-stack-md">
              {content.usp_heading || HOMEPAGE_DEFAULTS.usp_heading}
            </h2>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
              {uspItems.map((item: { icon: string; title: string; description: string }, i: number) => (
                <div key={i} className="flex flex-col items-center gap-2 w-[150px]">
                  <span className="material-symbols-outlined text-brand-primary text-[28px]">
                    {item.icon || "star"}
                  </span>
                  <h3 className="font-headline-md text-headline-md text-text-primary">{item.title}</h3>
                  <p className="font-body-sm text-body-sm text-text-secondary">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <TestimonialsCarousel testimonials={testimonials as any} />
      </div>

      {/* Large emotional closing CTA — full-bleed, sits outside the padded container */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 min-h-[360px] md:min-h-[440px] overflow-hidden mb-stack-lg flex items-center">
        <Image
          src={content.closing_cta_image_url || HOMEPAGE_DEFAULTS.closing_cta_image_url}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0) 70%)",
          }}
        />
        <div className="relative z-10 px-6 md:px-16 max-w-lg">
          <h2 className="font-display-md text-[32px] md:text-[44px] text-white leading-[1.15] tracking-tight mb-3">
            {(content.closing_cta_headline || HOMEPAGE_DEFAULTS.closing_cta_headline)
              .split(".")
              .filter(Boolean)
              .map((line: string, i: number) => (
                <span key={i} className={i === 1 ? "italic font-normal block" : "block"}>
                  {line.trim()}.
                </span>
              ))}
          </h2>
          <p className="font-body-md text-body-md text-white/90 mb-6">
            {content.closing_cta_subtext || HOMEPAGE_DEFAULTS.closing_cta_subtext}
          </p>
          <Link
            href={content.closing_cta_button_link || HOMEPAGE_DEFAULTS.closing_cta_button_link}
            className="inline-flex items-center justify-center bg-white text-text-primary font-button text-button h-12 px-7 hover:bg-surface-canvas transition-colors duration-300 w-fit"
          >
            {content.closing_cta_button_text || HOMEPAGE_DEFAULTS.closing_cta_button_text}
          </Link>
        </div>
      </section>
    </>
  );
}
