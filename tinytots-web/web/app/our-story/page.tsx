import Link from "next/link";
import Image from "next/image";
import { supabaseAnon as supabase } from "@/lib/supabase-anon";
import InternalTrustStrip from "@/components/InternalTrustStrip";

// Static-generate — pure marketing content, no per-user data. ISR-revalidate
// hourly since it changes rarely (admin-edited CMS content).
export const revalidate = 3600;

const DEFAULTS = {
  hero_image_url: "",
  hero_image_url_mobile: "",
  hero_eyebrow: "Our Story",
  hero_headline: "Timeless pieces, made for tiny hearts.",
  hero_subtext:
    "TinyTots began with a simple belief - childhood is beautiful, and what they wear should be too.",
  body_paragraph_1:
    "We create thoughtfully designed clothing that's soft, comfortable, and made to be cherished today, handed down tomorrow, and remembered always.",
  section2_eyebrow: "From The Beginning",
  section2_headline: "Built on love, inspired by little moments.",
  section2_body:
    "Founded in 2024, TinyTots was created for modern families who value quality, simplicity, and meaning in the everyday. From the fabrics we choose to the details we design, everything we do is guided by care.",
  section2_image_url: "",
  section2_signature: "With love, The TinyTots Team",
  pillars: [
    { icon: "eco", title: "Thoughtful Quality", body: "We use premium, breathable fabrics that are gentle on delicate skin and made to last." },
    { icon: "favorite", title: "Made with Care", body: "Every piece is designed with love and attention to every little detail." },
    { icon: "spa", title: "Timeless Style", body: "Classic, neutral designs that never go out of style and can be cherished for years." },
    { icon: "diversity_3", title: "For Every Family", body: "Inclusive sizing, flexible essentials, and pieces that fit beautifully into real family life." },
  ],
  section4_eyebrow: "More Than Clothes",
  cta_image_url: "",
  cta_heading: "Creating memories that last a lifetime.",
  body_paragraph_2:
    "TinyTots is here to celebrate the wonder of childhood and be part of your most precious moments.",
  cta_button_text: "Shop Our Collections",
  cta_button_link: "/products",
};

export default async function OurStoryPage() {
  const { data } = await supabase.from("about_page_content").select("*").eq("id", 1).single();
  const c = { ...DEFAULTS, ...(data || {}) };
  const pillars = c.pillars && c.pillars.length > 0 ? c.pillars : DEFAULTS.pillars;

  return (
    <>
      {/* Hero — single full-bleed image, text overlaid directly (same proven
          pattern as the homepage hero: text sits on the photo's naturally
          lighter side, not a separate solid panel). */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 aspect-[4/5] sm:aspect-[16/9] mb-stack-lg overflow-hidden bg-surface-canvas">
        {c.hero_image_url_mobile ? (
          <Image
            src={c.hero_image_url_mobile}
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover sm:hidden"
          />
        ) : (
          <div className="absolute inset-0 sm:hidden bg-surface-secondary" />
        )}
        {c.hero_image_url ? (
          <Image
            src={c.hero_image_url}
            alt=""
            fill
            sizes="100vw"
            priority
            className={`object-cover ${c.hero_image_url_mobile ? "hidden sm:block" : ""}`}
          />
        ) : (
          <div className={`absolute inset-0 bg-surface-secondary ${c.hero_image_url_mobile ? "hidden sm:block" : ""}`} />
        )}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(250,247,242,0.92) 0%, rgba(250,247,242,0.55) 38%, rgba(250,247,242,0) 62%)",
          }}
        />
        <div className="absolute inset-0 z-[2] flex flex-col justify-center px-6 sm:px-10 md:px-16">
          <div className="max-w-md">
            <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-3 block">
              {c.hero_eyebrow}
            </span>
            <h1 className="font-display-xl text-[30px] sm:text-[36px] md:text-[44px] text-text-primary leading-[1.15] tracking-tight mb-4">
              {c.hero_headline}
            </h1>
            {c.hero_subtext && (
              <p className="font-body-md text-body-md text-text-secondary mb-3 leading-snug">{c.hero_subtext}</p>
            )}
            {c.body_paragraph_1 && (
              <p className="font-body-md text-body-md text-text-secondary leading-snug">{c.body_paragraph_1}</p>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Built on love, inspired by little moments */}
        <section className="mb-stack-lg grid grid-cols-1 md:grid-cols-2 gap-bento-gap items-center">
          <div className="relative aspect-[4/5] md:aspect-square overflow-hidden">
            {c.section2_image_url ? (
              <Image
                src={c.section2_image_url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-surface-secondary" />
            )}
          </div>
          <div className="relative overflow-hidden py-4">
            <svg
              className="absolute bottom-0 right-0 w-28 md:w-36 h-auto text-brand-primary/20 pointer-events-none"
              viewBox="0 0 160 200"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              aria-hidden="true"
            >
              <path d="M80 200 V60" />
              <path d="M80 130 C55 120 45 95 55 70" />
              <path d="M80 100 C105 90 115 65 105 40" />
              <ellipse cx="52" cy="66" rx="9" ry="14" transform="rotate(-30 52 66)" />
              <ellipse cx="103" cy="37" rx="9" ry="14" transform="rotate(25 103 37)" />
            </svg>
            <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-3 block">
              {c.section2_eyebrow}
            </span>
            <h2 className="font-display-xl text-[26px] md:text-[32px] text-text-primary tracking-tight mb-4 max-w-md">
              {c.section2_headline}
            </h2>
            <p className="font-body-md text-body-md text-text-secondary mb-6 max-w-sm leading-relaxed">
              {c.section2_body}
            </p>
            <p className="font-display-xl italic text-[18px] text-text-primary">{c.section2_signature}</p>
          </div>
        </section>
      </div>

      {/* What We Stand For */}
      <section className="w-screen relative left-1/2 -translate-x-1/2 bg-brand-primary/[0.04] py-stack-lg mb-stack-lg">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <h2 className="font-label-md text-label-md uppercase tracking-wide text-text-secondary text-center mb-stack-md">
            What We Stand For
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 max-w-4xl mx-auto">
            {pillars.map((p: { icon: string; title: string; body: string }, i: number) => (
              <div key={i} className="flex flex-col items-center text-center gap-2 px-2">
                <span className="material-symbols-outlined text-brand-primary text-[28px]">{p.icon}</span>
                <h3 className="font-headline-md text-headline-md text-text-primary">{p.title}</h3>
                <p className="font-body-sm text-body-sm text-text-secondary">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
      </div>

      {/* Creating memories that last a lifetime — full-bleed banner per
          master batch spec (was a contained two-column block). Uses the
          dedicated about_page_content.cta_image_url asset, same
          full-bleed + gradient-scrim pattern as the hero/homepage. */}
      <Link
        href={c.cta_button_link}
        className="relative w-screen left-1/2 -translate-x-1/2 min-h-[380px] md:min-h-[440px] overflow-hidden mb-stack-lg flex items-center"
      >
        {c.cta_image_url ? (
          <Image src={c.cta_image_url} alt="" fill sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-surface-secondary" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0) 70%)",
          }}
        />
        <div className="relative z-10 px-6 md:px-16 max-w-md">
          <span className="font-label-md text-label-md uppercase tracking-wider text-white/80 mb-3 block">
            {c.section4_eyebrow}
          </span>
          <h2 className="font-display-xl text-[28px] md:text-[36px] text-white tracking-tight mb-4">
            {c.cta_heading}
          </h2>
          <p className="font-body-md text-body-md text-white/90 mb-6">{c.body_paragraph_2}</p>
          <span className="inline-flex items-center gap-2 bg-white text-text-primary font-button text-button h-12 px-6 hover:bg-surface-canvas transition-colors w-fit">
            {c.cta_button_text}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </span>
        </div>
      </Link>

      <InternalTrustStrip />
    </>
  );
}
