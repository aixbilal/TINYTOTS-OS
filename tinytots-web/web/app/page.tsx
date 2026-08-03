import type { Metadata } from "next";
import Image from "next/image";
import dynamic from "next/dynamic";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { supabaseAnon as supabase } from "@/lib/supabase-anon";
import Link from "next/link";
import ProductCarouselTabs from "@/components/ProductCarouselTabs";
import UspMarquee from "@/components/UspMarquee";
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
// Aspect-square stack (~max-w-2xl) — reserve layout so dynamic chunk load doesn't CLS.
const ProductCardStack = dynamic(() => import("@/components/ProductCardStack"), {
  loading: () => (
    <div className="w-full max-w-2xl mx-auto aspect-square md:aspect-[2/1]" aria-hidden />
  ),
});
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
  trending_heading: "Trending Now",
  stack_heading: "Trending Now",
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
    trendingProductIds: number[] | null | undefined,
    stackSelectionType: string | null | undefined,
    stackCategory: string | null | undefined,
    stackProductIds: number[] | null | undefined
  ) => {
    const [trendingProducts, stackProducts, testimonials] = await Promise.all([
      getProductsForSection(trendingSelectionType, trendingCategory, trendingProductIds),
      getProductsForSection(stackSelectionType, stackCategory, stackProductIds),
      getHomepageTestimonials(),
    ]);
    return { trendingProducts, stackProducts, testimonials };
  },
  ["homepage-sections"],
  { revalidate: 60 }
);

export default async function Home() {
  const content = await getHomepageContent();
  const { trendingProducts, stackProducts, testimonials } = await getHomepageSections(
    content.trending_selection_type,
    content.trending_category,
    content.trending_product_ids,
    content.stack_selection_type,
    content.stack_category,
    content.stack_product_ids
  );

  const heroSlides = resolveHeroSlides(content);
  const lcpSlide = heroSlides[0];
  const trustItems = resolveTrustItems(content.trust_items);
  const uspItems =
    content.usp_items && content.usp_items.length > 0 ? content.usp_items : HOMEPAGE_DEFAULTS.usp_items;
  const trendingHeading = content.trending_heading || HOMEPAGE_DEFAULTS.trending_heading;
  const stackHeading = content.stack_heading || HOMEPAGE_DEFAULTS.stack_heading;

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
          <section className="w-full border-t border-b border-outline-variant/30 py-4 mb-stack-lg bg-surface-container-lowest">
            <div className="flex flex-wrap md:flex-nowrap justify-center md:justify-between items-center gap-6 px-4">
              {trustItems.map((item, i) => (
                <div key={`${item.label}-${i}`} className="contents">
                  {i > 0 && <div className="hidden md:block w-px h-6 bg-outline-variant/30" />}
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase">
                      {item.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section id="trending" className="mb-stack-lg">
          <h2 className="font-display-md text-[32px] md:text-[48px] text-on-surface tracking-tight mb-stack-md">
            {trendingHeading}
          </h2>
          <ProductCarouselTabs
            hideHeading
            tabs={[
              {
                key: "trending",
                label: trendingHeading,
                products: trendingProducts as any,
              },
            ]}
          />
        </section>

        <TestimonialsCarousel testimonials={testimonials as any} />

        <section className="mb-stack-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-bento-gap h-auto md:h-[500px]">
            <Link
              href={sectionLink(
                content.meadow_selection_type,
                content.meadow_category,
                content.meadow_product_ids,
                content.meadow_link ?? HOMEPAGE_DEFAULTS.meadow_link
              )}
              className="md:col-span-2 relative rounded-[16px] overflow-hidden border border-outline-variant/30 group cursor-pointer min-h-[220px] md:min-h-0"
            >
              <Image
                src={content.meadow_image_url ?? HOMEPAGE_DEFAULTS.meadow_image_url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col items-start">
                <span className="bg-surface-container-lowest/90 backdrop-blur text-on-surface font-label-md text-label-md px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                  {content.meadow_badge_text ?? HOMEPAGE_DEFAULTS.meadow_badge_text}
                </span>
                <h3 className="font-headline-lg md:font-display-md text-headline-lg md:text-display-md text-white mb-4">
                  {content.meadow_heading ?? HOMEPAGE_DEFAULTS.meadow_heading}
                </h3>
                <span className="bg-white text-on-surface font-button text-button px-6 py-2 rounded-lg group-hover:bg-surface-container-low transition-colors inline-block">
                  {content.meadow_button_text ?? HOMEPAGE_DEFAULTS.meadow_button_text}
                </span>
              </div>
            </Link>
            <div className="flex flex-col gap-bento-gap">
              <Link
                href="/products?gender=boy"
                className="relative flex-1 rounded-[16px] overflow-hidden border border-outline-variant/30 group cursor-pointer min-h-[140px] md:min-h-[200px]"
              >
                <Image
                  src={content.boys_image_url ?? HOMEPAGE_DEFAULTS.boys_image_url}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute bottom-4 left-4 z-10">
                  <h3 className="font-headline-md text-headline-md text-white mb-2">
                    {content.boys_heading || HOMEPAGE_DEFAULTS.boys_heading}
                  </h3>
                  <span className="text-white flex items-center font-body-sm text-body-sm group-hover:underline">
                    {content.boys_button_text || HOMEPAGE_DEFAULTS.boys_button_text}{" "}
                    <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
                  </span>
                </div>
              </Link>
              <Link
                href="/products?gender=girl"
                className="relative flex-1 rounded-[16px] overflow-hidden border border-outline-variant/30 group cursor-pointer min-h-[140px] md:min-h-[200px]"
              >
                <Image
                  src={content.girls_image_url ?? HOMEPAGE_DEFAULTS.girls_image_url}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute bottom-4 left-4 z-10">
                  <h3 className="font-headline-md text-headline-md text-white mb-2">
                    {content.girls_heading || HOMEPAGE_DEFAULTS.girls_heading}
                  </h3>
                  <span className="text-white flex items-center font-body-sm text-body-sm group-hover:underline">
                    {content.girls_button_text || HOMEPAGE_DEFAULTS.girls_button_text}{" "}
                    <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {stackProducts.length > 0 && (
          <section className="mb-stack-lg">
            <h2 className="font-display-md text-[32px] md:text-[48px] text-on-surface tracking-tight mb-stack-md text-center">
              {stackHeading}
            </h2>
            <ProductCardStack products={stackProducts as any} />
          </section>
        )}

        {uspItems.length > 0 && (
          <section className="mb-stack-lg">
            <h2 className="font-headline-lg text-on-surface mb-stack-md text-center">
              {content.usp_heading || HOMEPAGE_DEFAULTS.usp_heading}
            </h2>
            <UspMarquee items={uspItems} />
          </section>
        )}
      </div>
    </>
  );
}
