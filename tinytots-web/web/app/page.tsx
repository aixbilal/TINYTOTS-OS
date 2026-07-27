import { supabase } from "@/lib/supabase";
import Link from "next/link";

// Same root cause and fix as app/products/[id]/page.tsx and
// app/api/products/route.ts — without this, Next.js caches this Server
// Component's Supabase data fetch indefinitely, so newly uploaded images,
// price changes, and stock updates never show up on the homepage until a
// full rebuild.
export const dynamic = "force-dynamic";

async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      sku,
      brand,
      image_url,
    variants (
  id,
  price,
  web_price,
  stock
)
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) return [];
  return data;
}

// Admin-editable hero banner and Trending Now heading, with hardcoded
// fallbacks matching the original design in case the row is ever missing.
const HOMEPAGE_DEFAULTS = {
  hero_image_url:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDcHOEBpwtxoe3pT3NNiOQoUlZSPXHZXzjeoQOBkGcnwMqk8LNEfS_BLaNFvbDX-hie2mEl7T0RXcYZiRo62Rvdf50WGU9U4BD5oXHj7_E-gwRRFNXsBN-fTWavIdwpKxC17urnpJTVwBoPKRa1I79HkhFnqTLljxe6--Z6Hlwkbqweez3itoFTvxizLNFwL3tMrsZt3LeJQ-PBMbb1EiJJB23UvYLpk3iw905UJTcODCR79jbCm2P_w_RYfYB_hiR-KWOI441C-kke",
  hero_headline: "Playful Designs for Little Pioneers",
  hero_subtext: "Ethically crafted, modern essentials for every stage of your child's early journey.",
  hero_button_text: "Shop New Arrivals",
  hero_button_link: "#trending",
  trending_heading: "Trending Now",
  meadow_image_url:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD8Kx1YOh37r9_tpddrRx-z8ThyZ74VSqpZ8NqUnuAkyKpMprUo6QvWwqSSsEAdqYjmB8_VspVcq243mW9a22_3h2uBkoj0HsGYa9zMowQLOW9MHk0XF5DbcrXkdkT-N_-7h5kT9AGG2BKHkZ6lR4Z-1-JuIolvhibU6NmMriHSQUJDGTJf97EnY-lHUWEAB0lC50ARUK0xVIRuln4l0asI6-ON9Q36p900XcyxhlFoKFDQGDSKpihL40rJhWsAylmx-xlFJabMaUOM",
  boys_image_url:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBOxH5NNX2M4TZ_MpabUd6iR43Lqhl4mFUPL1vygsT6U1bIZ5Wap_3XSxsXwMWuTpJtQjGi1xQUQ0xlBJTfeIdLJbliy7pXKJo4yrKNaOC-9z47-0vKeKtG0yMUAieIJkIQzShvCusjWv4HMiprijPupQmRH7maK_H1bGvYeJOQPSB6-Vvc2ST4xCIh72JtiSddsb8tEqrSymHPvPcFy4cFJ4xxnkl7A9vkWZEQ12bIJVnmM-Pu-aPA1yPpjf6jsWkS9BLBw74821_i",
  girls_image_url:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAex1tG2uv7lMIPIdDrPkL8txTXP-5lNjCD9jng7kNs6OcH_Ky94n8BWlY6cuBw71fG3Y01Wk_cRUvqnae2Q0zgpo5_zC77fJXWem1322uBxd60gIILFisAPS8wpWKA21VbKHRG7-aJ41OJBfx8Za033flnWypc0wBXWIfw6Z0DtvlSFrUpW0waIQ7CT6yae7FvGXNj0ydtDn_RlUQCdvs-59xozzxbXO0S77lPanQ7IV2gjCXPsPIhHgv2Vr3i3DLgN9EgUgj0WR_s",
};

async function getHomepageContent() {
  const { data } = await supabase.from("homepage_content").select("*").eq("id", 1).single();
  return data || HOMEPAGE_DEFAULTS;
}

export default async function Home() {
  const [products, content] = await Promise.all([getProducts(), getHomepageContent()]);

  return (
    <main className="max-w-container-max mx-auto md:px-margin-desktop px-margin-mobile">
      {/* Hero */}
      <section className="relative w-full h-[500px] md:h-[700px] rounded-[16px] overflow-hidden mb-stack-lg border border-outline-variant/30 flex items-center justify-center text-center">
        <div
          className="absolute inset-0 bg-cover bg-center w-full h-full z-0"
          style={{
            backgroundImage: `url('${content.hero_image_url}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-surface/20 z-10" />
        <div className="relative z-20 max-w-2xl px-6 flex flex-col items-center">
          <h1 className="font-display-lg text-display-lg md:text-[64px] leading-tight text-on-surface mb-6">
            {content.hero_headline}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-lg">
            {content.hero_subtext}
          </p>
          <Link
            href={content.hero_button_link}
            className="bg-primary-container text-on-primary font-button text-button h-[56px] px-8 rounded-lg hover:bg-primary transition-colors duration-300 flex items-center"
          >
            {content.hero_button_text}
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <section className="w-full border-t border-b border-outline-variant/30 py-4 mb-stack-lg bg-surface-container-lowest">
        <div className="flex flex-wrap md:flex-nowrap justify-center md:justify-between items-center gap-6 px-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">payments</span>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">
              Cash on Delivery Available
            </span>
          </div>
          <div className="hidden md:block w-px h-6 bg-outline-variant/30" />
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">local_shipping</span>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">
              Free Delivery on All Orders
            </span>
          </div>
          <div className="hidden md:block w-px h-6 bg-outline-variant/30" />
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">replay</span>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">
              Easy 7-Day Returns
            </span>
          </div>
        </div>
      </section>

      {/* Shop by age — static for now, needs age_bracket filtering wired up later */}
      <section className="mb-stack-lg">
        <div className="flex justify-between items-end mb-stack-sm">
          <h2 className="font-headline-lg text-on-surface">Shop by Age</h2>
        </div>
        <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2">
          {["Newborn", "0–1yr", "1–3yr", "3–6yr", "6–9yr"].map((label, i) => (
            <button
              key={label}
              className={`flex-shrink-0 font-button text-button px-6 py-3 rounded-full border transition-all ${
                i === 0
                  ? "bg-primary-container text-on-primary border-primary-container"
                  : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-low"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Trending now — real product data */}
      <section id="trending" className="mb-stack-lg">
      <div className="flex justify-between items-end mb-stack-md">
  <h2 className="font-headline-lg text-on-surface">{content.trending_heading}</h2>
  <Link href="/products" className="font-body-sm text-body-sm text-primary hover:underline">
    View All
  </Link>
</div>

        {products.length === 0 && (
          <p className="text-on-surface-variant">No products available right now.</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-bento-gap">
          {products.map((product: any) => {
          const prices = product.variants.map((v: any) => v.web_price ?? v.price);
            const minPrice = prices.length ? Math.min(...prices) : 0;
            const totalStock = product.variants.reduce(
              (sum: number, v: any) => sum + v.stock,
              0
            );

            return (
              <Link key={product.id} href={`/products/${product.id}`} className="group cursor-pointer">
                <div className="relative w-full aspect-square rounded-[16px] overflow-hidden border border-outline-variant/30 mb-4 bg-surface-container-lowest">
                  {totalStock > 0 && totalStock <= 5 && (
                    <div className="absolute top-2 left-2 bg-[#D9822B] text-white font-label-md text-label-md px-2 py-1 rounded-full z-10">
                      Few Left
                    </div>
                  )}
                  {product.image_url ? (
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={product.image_url}
                      alt={product.name}
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center text-on-surface-variant text-sm">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-body-md text-body-md text-on-surface">{product.name}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Rs. {minPrice.toLocaleString()}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Bento Grid Promotional Area */}
      <section className="mb-stack-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-bento-gap h-auto md:h-[500px]">
          <Link
            href="/products?collection=meadow-edit"
            className="md:col-span-2 relative rounded-[16px] overflow-hidden border border-outline-variant/30 group cursor-pointer min-h-[300px]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center w-full h-full transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url('${content.meadow_image_url ?? HOMEPAGE_DEFAULTS.meadow_image_url}')` }}
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col items-start">
              <span className="bg-surface-container-lowest/90 backdrop-blur text-on-surface font-label-md text-label-md px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                Spring Collection
              </span>
              <h3 className="font-display-md text-display-md text-white mb-4">The Meadow Edit</h3>
              <span className="bg-white text-on-surface font-button text-button px-6 py-2 rounded-lg group-hover:bg-surface-container-low transition-colors inline-block">
                Explore Collection
              </span>
            </div>
          </Link>
          <div className="flex flex-col gap-bento-gap">
            <Link
              href="/products?category=boys"
              className="relative flex-1 rounded-[16px] overflow-hidden border border-outline-variant/30 group cursor-pointer min-h-[200px]"
            >
              <div
                className="absolute inset-0 bg-cover bg-center w-full h-full transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('${content.boys_image_url ?? HOMEPAGE_DEFAULTS.boys_image_url}')` }}
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute bottom-4 left-4 z-10">
                <h3 className="font-headline-md text-headline-md text-white mb-2">Boys</h3>
                <span className="text-white flex items-center font-body-sm text-body-sm group-hover:underline">
                  Shop Now <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
                </span>
              </div>
            </Link>
            <Link
              href="/products?category=girls"
              className="relative flex-1 rounded-[16px] overflow-hidden border border-outline-variant/30 group cursor-pointer min-h-[200px]"
            >
              <div
                className="absolute inset-0 bg-cover bg-center w-full h-full transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('${content.girls_image_url ?? HOMEPAGE_DEFAULTS.girls_image_url}')` }}
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute bottom-4 left-4 z-10">
                <h3 className="font-headline-md text-headline-md text-white mb-2">Girls</h3>
                <span className="text-white flex items-center font-body-sm text-body-sm group-hover:underline">
                  Shop Now <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}