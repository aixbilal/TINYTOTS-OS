// Shared four-point trust strip for internal (non-Homepage) pages, per the
// master implementation batch spec. Exactly 4 items, Pakistan-specific
// wording, no dollar amounts, no "60-day". Built as one component used
// identically across Shop All/Product Detail/Cart/Checkout/About/Blog so a
// future wording change only happens in one place.
export default function InternalTrustStrip() {
  const items = [
    {
      icon: "eco",
      title: "Premium Quality",
      body: "Thoughtfully made",
    },
    {
      icon: "local_shipping",
      title: "Free Shipping",
      body: "Across Pakistan",
    },
    {
      icon: "replay",
      title: "Easy Returns",
      body: "7-day return policy",
    },
    {
      icon: "lock",
      title: "Secure Payments",
      body: "Safe & trusted payments",
    },
  ];

  return (
    <section className="w-screen relative left-1/2 -translate-x-1/2 bg-brand-primary/[0.04] border-t border-brand-primary/10 py-8 mb-stack-lg">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-3">
            <span className="material-symbols-outlined text-brand-primary">{item.icon}</span>
            <div>
              <p className="font-label-md text-label-md text-text-primary font-semibold">{item.title}</p>
              <p className="font-label-md text-label-md text-text-secondary">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
