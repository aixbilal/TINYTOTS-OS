import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  hero_image_url:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDcHOEBpwtxoe3pT3NNiOQoUlZSPXHZXzjeoQOBkGcnwMqk8LNEfS_BLaNFvbDX-hie2mEl7T0RXcYZiRo62Rvdf50WGU9U4BD5oXHj7_E-gwRRFNXsBN-fTWavIdwpKxC17urnpJTVwBoPKRa1I79HkhFnqTLljxe6--Z6Hlwkbqweez3itoFTvxizLNFwL3tMrsZt3LeJQ-PBMbb1EiJJB23UvYLpk3iw905UJTcODCR79jbCm2P_w_RYfYB_hiR-KWOI441C-kke",
  hero_headline: "Designed for play. Made for comfort. Built for Pakistan.",
  quote_text:
    "We believe childhood is a brief, magical window. Our garments shouldn't distract from the play — they should enable it, naturally.",
  quote_attribution: "The Founders",
  body_paragraph_1:
    "TinyTots was born out of a simple necessity: the search for uncompromising quality in children's wear that didn't forsake the environment or local craftsmanship.",
  body_paragraph_2:
    "We champion ethical manufacturing processes, partnering directly with artisanal workshops across Pakistan. Every piece is constructed from thoughtfully sourced organic materials, ensuring a gentle touch against delicate skin while remaining robust enough for the rigors of playground adventures.",
  body_paragraph_3:
    "By streamlining our supply chain and focusing on timeless essentials, we deliver sustainable luxury at a pricing model that respects families. It's a commitment to our children, our community, and our earth.",
  pillars: [
    { icon: "eco", title: "Soft on Skin", body: "Sourced from pure, organic cotton fields. Free from harsh chemicals, synthetic dyes, or irritating tags, ensuring maximum comfort for sensitive early years." },
    { icon: "strikethrough_s", title: "Built for Play", body: "Engineered with reinforced double-stitching at critical stress points. Our garments withstand crawling, climbing, and countless wash cycles without losing their shape." },
    { icon: "map", title: "Ethically Sourced", body: "Proudly designed and ethically produced in Pakistan. We ensure fair wages, safe working conditions, and actively support local artisan communities." },
  ],
  cta_image_url:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC7yxVcADAps3cmNLkJr8FGA6JeKmVrlesZnXqwQdhOLqdCGmVEKY22R7aE09WRXqNokfy8JzvSPf3tssmBSiWdkYwuIooiwQQfCn8_jlfsUFc1RbMINfy5orTZSQHYih3obVl7aqtOJBD_jt1CxBXMFKAUEkAe59L0zZspz8oyJFHsPhjfLpcIj4hQWwp8lx3tMlWlR0RX3UoQ0ZVBf1Gzs8Do92kjAB4OpHGYrUYsGE5gjbGuH3Ez-MwiXx_V2uhCVSGd0GHJGZlT",
  cta_heading: "Ready to experience the difference?",
  cta_button_text: "Explore Our Collections",
  cta_button_link: "/products",
};

export default async function Page() {
  const { data } = await supabase.from("about_page_content").select("*").eq("id", 1).single();
  const c = { ...DEFAULTS, ...(data || {}) };
  const pillars = c.pillars && c.pillars.length > 0 ? c.pillars : DEFAULTS.pillars;

  return (
    <main className="max-w-container-max mx-auto md:px-margin-desktop px-margin-mobile">
      {/* Hero */}
      <section className="relative w-full h-[320px] md:h-[560px] rounded-[16px] overflow-hidden mb-stack-lg border border-outline-variant/30 flex items-center justify-center text-center">
        <div
          className="absolute inset-0 bg-cover bg-center w-full h-full z-0"
          style={{ backgroundImage: `url('${c.hero_image_url}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/85 via-surface/10 to-surface/20 z-10" />
        <div className="relative z-20 max-w-3xl px-6">
          <h1 className="font-display-lg text-[32px] md:text-[56px] leading-tight text-on-surface drop-shadow-sm">
            {c.hero_headline}
          </h1>
        </div>
      </section>

      {/* Founders manifesto */}
      <section className="py-stack-lg grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
        <div className="md:col-span-5 md:col-start-1">
          <blockquote className="font-headline-md text-headline-md text-primary italic pr-2 md:pr-8 border-l-4 border-primary/60 pl-6">
            &ldquo;{c.quote_text}&rdquo;
          </blockquote>
          <p className="mt-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
            {c.quote_attribution}
          </p>
        </div>
        <div className="md:col-span-6 md:col-start-7 text-on-surface-variant">
          <p className="font-body-lg text-body-md md:text-body-lg mb-6">{c.body_paragraph_1}</p>
          <p className="font-body-md text-body-md mb-6">{c.body_paragraph_2}</p>
          <p className="font-body-md text-body-md">{c.body_paragraph_3}</p>
        </div>
      </section>

      {/* Core pillars */}
      <section className="py-stack-lg -mx-margin-mobile md:mx-0 px-margin-mobile md:px-0 bg-surface-container-low rounded-[16px]">
        <div className="px-6 md:px-12 py-stack-lg">
          <div className="text-center mb-12">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-3">Our Core Pillars</h2>
            <p className="font-body-lg text-body-md md:text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              The unyielding standards we measure every garment against.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-bento-gap">
            {pillars.map((p: { icon: string; title: string; body: string }, i: number) => (
              <div
                key={i}
                className="bg-surface rounded-[16px] p-6 md:p-8 border border-outline-variant/30 shadow-[0px_4px_20px_rgba(79,98,99,0.04)] hover:shadow-[0px_8px_30px_rgba(79,98,99,0.08)] transition-all duration-300 hover:-translate-y-1 flex flex-col items-start"
              >
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-secondary">{p.icon}</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface mb-3">{p.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative my-stack-lg py-16 md:py-32 rounded-[16px] overflow-hidden border border-outline-variant/30 flex items-center justify-center text-center">
        <div
          className="absolute inset-0 bg-cover bg-center w-full h-full z-0"
          style={{ backgroundImage: `url('${c.cta_image_url}')` }}
        />
        <div className="absolute inset-0 bg-on-background/40 z-10" />
        <div className="relative z-20 px-6">
          <h2 className="font-headline-md text-headline-md text-surface mb-8">{c.cta_heading}</h2>
          <Link
            href={c.cta_button_link}
            className="inline-flex items-center justify-center px-8 py-4 bg-primary-container text-on-primary rounded-full font-label-md text-label-md uppercase tracking-wider hover:bg-primary transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200"
          >
            {c.cta_button_text}
          </Link>
        </div>
      </section>
    </main>
  );
}
