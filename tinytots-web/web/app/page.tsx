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

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="max-w-container-max mx-auto md:px-margin-desktop px-margin-mobile">
      {/* Hero */}
      <section className="relative w-full h-[500px] md:h-[700px] rounded-[16px] overflow-hidden mb-stack-lg border border-outline-variant/30 flex items-center justify-center text-center">
        <div
          className="absolute inset-0 bg-cover bg-center w-full h-full z-0"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDcHOEBpwtxoe3pT3NNiOQoUlZSPXHZXzjeoQOBkGcnwMqk8LNEfS_BLaNFvbDX-hie2mEl7T0RXcYZiRo62Rvdf50WGU9U4BD5oXHj7_E-gwRRFNXsBN-fTWavIdwpKxC17urnpJTVwBoPKRa1I79HkhFnqTLljxe6--Z6Hlwkbqweez3itoFTvxizLNFwL3tMrsZt3LeJQ-PBMbb1EiJJB23UvYLpk3iw905UJTcODCR79jbCm2P_w_RYfYB_hiR-KWOI441C-kke')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-surface/20 z-10" />
        <div className="relative z-20 max-w-2xl px-6 flex flex-col items-center">
          <h1 className="font-display-lg text-display-lg md:text-[64px] leading-tight text-on-surface mb-6">
            Playful Designs for Little Pioneers
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-lg">
            Ethically crafted, modern essentials for every stage of your child&apos;s early journey.
          </p>
          <Link
            href="#trending"
            className="bg-primary-container text-on-primary font-button text-button h-[56px] px-8 rounded-lg hover:bg-primary transition-colors duration-300 flex items-center"
          >
            Shop New Arrivals
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
              Free Delivery on First Order
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
  <h2 className="font-headline-lg text-on-surface">Trending Now</h2>
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
    </main>
  );
}