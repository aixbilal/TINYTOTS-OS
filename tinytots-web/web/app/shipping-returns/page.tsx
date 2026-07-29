import Link from "next/link";

const TIMELINES = [
  { icon: "package_2", label: "Order Preparation", value: "Within 24 Hours" },
  { icon: "local_shipping", label: "Punjab & Islamabad", value: "2–3 Business Days" },
  { icon: "map", label: "Other Provinces", value: "4–7 Business Days" },
];

const COD_TIERS = [
  { range: "Under Rs. 5,000", detail: "Full Cash on Delivery — no advance payment needed." },
  { range: "Rs. 5,000 – Rs. 10,000", detail: "A 10% advance token payment is required before dispatch." },
  { range: "Above Rs. 10,000", detail: "A flat Rs. 2,000 advance token payment is required before dispatch." },
];

const STEPS = [
  {
    icon: "assignment_return",
    title: "Request Initiation",
    body: "Start a return request from your Account within 7 days of delivery. Items must be unworn, unwashed, with tags intact.",
  },
  {
    icon: "airport_shuttle",
    title: "Pickup or Drop-off",
    body: "Once approved, we'll arrange collection or share drop-off details, depending on your area.",
  },
  {
    icon: "verified",
    title: "Validation & Refund",
    body: "Once we receive and inspect the item, your refund or store credit is issued according to your chosen method.",
  },
];

const SECTIONS = [
  { id: "delivery-timelines", title: "Delivery Timelines" },
  { id: "cash-on-delivery", title: "Cash on Delivery Terms" },
  { id: "returns-process", title: "Return & Exchange Process" },
];

export default function ShippingReturnsPage() {
  return (
    <main className="max-w-container-max mx-auto w-full py-stack-lg flex flex-col md:flex-row gap-gutter px-margin-mobile md:px-0">
      <aside className="hidden md:block w-56 shrink-0 sticky top-28 h-fit">
        <p className="font-label-lg text-label-lg text-on-surface font-semibold uppercase tracking-wider mb-3">
          Contents
        </p>
        <nav className="flex flex-col gap-1">
          {SECTIONS.map((s) => (
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
        <h1 className="font-display-md text-display-md text-on-surface mb-3">Shipping & Returns</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Clear timelines and straightforward policies, so you always know where your order stands.
        </p>
      </div>

      {/* Delivery timelines */}
      <section id="delivery-timelines" className="mb-stack-lg">
        <h2 className="font-headline-lg text-on-surface mb-stack-sm">Delivery Timelines in Pakistan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-bento-gap">
          {TIMELINES.map((t) => (
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

      {/* COD tiers */}
      <section id="cash-on-delivery" className="mb-stack-lg">
        <h2 className="font-headline-lg text-on-surface mb-2">Cash on Delivery Terms</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-sm max-w-2xl">
          To keep our delivery network running smoothly, some COD orders require a small advance
          token payment before dispatch. Your order total determines which tier applies:
        </p>
        <div className="flex flex-col gap-3 max-w-2xl">
          {COD_TIERS.map((tier) => (
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

      {/* Returns lifecycle */}
      <section id="returns-process" className="mb-stack-lg">
        <h2 className="font-headline-lg text-on-surface mb-stack-sm">Return & Exchange Process</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-bento-gap">
          {STEPS.map((step, i) => (
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

      {/* CTA */}
      <section className="border border-outline-variant/20 rounded-2xl p-8 bg-surface-container-lowest flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-[32px]">support_agent</span>
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">Need help with an order?</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Our team is happy to help with delivery or return questions.
            </p>
          </div>
        </div>
        <Link
          href="/help"
          className="bg-primary-container text-on-primary font-button text-button h-12 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
        >
          Visit Help Center <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </section>
      </div>
    </main>
  );
}