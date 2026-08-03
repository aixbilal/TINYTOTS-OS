import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type TocItem = { id: string; title: string };
type Timeline = { icon: string; label: string; value: string };
type CodTier = { range: string; detail: string };
type Step = { icon: string; title: string; body: string };

const FALLBACK = {
  hero_title: "Shipping & Returns",
  hero_subtitle:
    "Clear timelines and straightforward policies, so you always know where your order stands.",
  toc: [
    { id: "delivery-timelines", title: "Delivery Timelines" },
    { id: "returns-process", title: "Return & Exchange Process" },
  ] as TocItem[],
  timelines_heading: "Delivery Timelines in Pakistan",
  timelines: [
    { icon: "package_2", label: "Order Preparation", value: "Within 24 Hours" },
    { icon: "local_shipping", label: "Punjab & Islamabad", value: "2–3 Business Days" },
    { icon: "map", label: "Other Provinces", value: "4–7 Business Days" },
  ] as Timeline[],
  cod_heading: "",
  cod_intro: "",
  // Empty by default — never resurrect seeded COD tiers when the row has [].
  cod_tiers: [] as CodTier[],
  steps_heading: "Return & Exchange Process",
  steps: [
    {
      icon: "assignment_return",
      title: "Request Initiation",
      body: "Start a return request within 7 days of delivery, via our Report an Issue page or by emailing support@tinytotsofficial.com. Items must be unworn and unwashed, with tags intact.",
    },
    {
      icon: "airport_shuttle",
      title: "Pickup or Drop-off",
      body: "Once approved, we'll arrange collection or share drop-off details, depending on your area. If the item arrived defective or incorrect, we cover return shipping — otherwise it's on the customer.",
    },
    {
      icon: "verified",
      title: "Validation & Refund",
      body: "Once we receive and inspect the item, you can choose an exchange or a refund. For Cash on Delivery orders, refunds are sent via bank transfer, JazzCash, or Easypaisa.",
    },
  ] as Step[],
  contact_heading: "Need help with an order?",
  contact_body: "Our team is happy to help with delivery or return questions.",
  contact_button_text: "Visit Help Center",
  contact_button_link: "/help",
};

export default async function ShippingReturnsPage() {
  const { data } = await supabaseAdmin
    .from("shipping_returns_content")
    .select("*")
    .eq("id", 1)
    .single();

  // Array.isArray(...) preserves intentional empty arrays (e.g. cod_tiers: [])
  // instead of falling back to seed data when length === 0.
  // Cast through typeof FALLBACK: spreading the loosely typed Supabase row would
  // otherwise widen the whole object (and every .map callback param) to `any`.
  const content: typeof FALLBACK = {
    ...FALLBACK,
    ...(data || {}),
    toc: Array.isArray(data?.toc) ? (data.toc as TocItem[]) : FALLBACK.toc,
    timelines: Array.isArray(data?.timelines) ? (data.timelines as Timeline[]) : FALLBACK.timelines,
    cod_tiers: Array.isArray(data?.cod_tiers) ? (data.cod_tiers as CodTier[]) : FALLBACK.cod_tiers,
    steps: Array.isArray(data?.steps) ? (data.steps as Step[]) : FALLBACK.steps,
  };

  const showCodSection = content.cod_tiers.length > 0;

  return (
    <main className="max-w-container-max mx-auto w-full py-stack-lg flex flex-col md:flex-row gap-gutter px-margin-mobile md:px-0">
      <aside className="hidden md:block w-56 shrink-0 sticky top-28 h-fit">
        <p className="font-label-lg text-label-lg text-on-surface font-semibold uppercase tracking-wider mb-3">
          Contents
        </p>
        <nav className="flex flex-col gap-1">
          {content.toc.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-3 py-2 rounded-lg font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
            >
              {s.title}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex-grow min-w-0">
        <div className="text-center max-w-2xl mx-auto mb-stack-lg">
          <h1 className="font-display-md text-display-md text-on-surface mb-3">{content.hero_title}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">{content.hero_subtitle}</p>
        </div>

        <section id="delivery-timelines" className="mb-stack-lg">
          <h2 className="font-headline-lg text-on-surface mb-stack-sm">{content.timelines_heading}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-bento-gap">
            {content.timelines.map((t) => (
              <div
                key={t.label}
                className="border border-outline-variant/20 rounded-2xl p-6 bg-surface-container-lowest flex flex-col items-center text-center gap-2"
              >
                <span className="material-symbols-outlined text-primary bg-primary-container/20 p-3 rounded-full text-[24px]">
                  {t.icon}
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{t.label}</p>
                <p className="font-headline-md text-headline-md text-on-surface">{t.value}</p>
              </div>
            ))}
          </div>
        </section>

        {showCodSection && (
          <section id="cash-on-delivery" className="mb-stack-lg">
            <h2 className="font-headline-lg text-on-surface mb-2">{content.cod_heading}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-sm max-w-2xl">
              {content.cod_intro}
            </p>
            <div className="flex flex-col gap-3 max-w-2xl">
              {content.cod_tiers.map((tier) => (
                <div
                  key={tier.range}
                  className="border border-outline-variant/20 rounded-xl px-5 py-4 bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
                >
                  <span className="font-body-md text-body-md text-on-surface font-semibold shrink-0 sm:w-48">
                    {tier.range}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tier.detail}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section id="returns-process" className="mb-stack-lg">
          <h2 className="font-headline-lg text-on-surface mb-stack-sm">{content.steps_heading}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-bento-gap">
            {content.steps.map((step, i) => (
              <div
                key={step.title}
                className="border border-outline-variant/20 rounded-2xl p-6 bg-surface-container-lowest flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-lg text-label-lg font-semibold shrink-0">
                    {i + 1}
                  </span>
                  <span className="material-symbols-outlined text-primary text-[22px]">{step.icon}</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface">{step.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-outline-variant/20 rounded-2xl p-8 bg-surface-container-lowest flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-[32px]">support_agent</span>
            <div>
              <p className="font-headline-md text-headline-md text-on-surface">{content.contact_heading}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{content.contact_body}</p>
            </div>
          </div>
          <Link
            href={content.contact_button_link || "/help"}
            className="bg-primary-container text-on-primary font-button text-button h-12 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
          >
            {content.contact_button_text}{" "}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
