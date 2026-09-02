import type { Metadata } from "next";
import Link from "next/link";
import InternalTrustStrip from "@/components/InternalTrustStrip";
import JumpToSectionSelect from "@/components/JumpToSectionSelect";

export const metadata: Metadata = { title: "Size Guide" };

const AGE_SIZES = [
  { age: "0–3 Months", height: "50–61 cm", weight: "3–6 kg", label: "NB / 0-3M" },
  { age: "3–6 Months", height: "61–67 cm", weight: "6–8 kg", label: "3-6M" },
  { age: "6–9 Months", height: "67–72 cm", weight: "8–9 kg", label: "6-9M" },
  { age: "9–12 Months", height: "72–76 cm", weight: "9–10.5 kg", label: "9-12M" },
  { age: "1–2 Years", height: "76–86 cm", weight: "10.5–13 kg", label: "1-2Y" },
  { age: "2–3 Years", height: "86–98 cm", weight: "13–15 kg", label: "2-3Y" },
  { age: "3–4 Years", height: "98–104 cm", weight: "15–17 kg", label: "3-4Y" },
];

const SHOE_SIZES = [
  { age: "6–12 Months", eu: "18–19", foot: "10.5–11.5 cm" },
  { age: "1–2 Years", eu: "20–22", foot: "12–13.5 cm" },
  { age: "2–3 Years", eu: "23–25", foot: "14–15.5 cm" },
  { age: "3–4 Years", eu: "26–27", foot: "16–16.5 cm" },
];

const HOW_TO_MEASURE = [
  { icon: "straighten", title: "Height", body: "Lay your child flat and measure from the top of the head to the heel." },
  { icon: "footprint", title: "Foot Length", body: "Trace their foot on paper while standing, then measure heel to toe at the longest point." },
  { icon: "monitor_weight", title: "Weight", body: "Use a standard scale; weigh your child without heavy clothing for the most accurate reading." },
];

const SECTIONS = [
  { id: "how-to-measure", title: "How to Measure" },
  { id: "clothing", title: "Clothing Size Guide" },
  { id: "footwear", title: "Footwear Size Guide" },
  { id: "tips", title: "Measurement Tips" },
];

export default function SizeGuidePage() {
  return (
    <>
      <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg">
        <nav className="font-body-sm text-body-sm text-text-secondary mb-stack-sm flex items-center gap-2">
          <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <Link href="/help" className="hover:text-brand-primary transition-colors">Help Center</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-text-primary">Size Guide</span>
        </nav>

        <div className="mb-stack-lg max-w-2xl">
          <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-2 block">
            Size Guide
          </span>
          <h1 className="font-display-xl text-display-md text-text-primary tracking-tight mb-3">
            Find the perfect fit for your little one.
          </h1>
          <p className="font-body-md text-body-md text-text-secondary">
            We know every child is unique. Babies grow at different rates, so use height and weight as
            your primary reference — if your little one is between sizes, we recommend sizing up.
          </p>
          <p className="font-body-sm text-body-sm text-text-secondary italic mt-3">
            Note: sizes on our product pages are shown as labels only. Use the tables below as a general
            reference alongside each product&apos;s description.
          </p>
        </div>

        {/* Mobile: jump nav */}
        <div className="md:hidden mb-stack-md">
          <label className="font-label-md text-label-md text-text-secondary mb-1 block">In this guide</label>
          <JumpToSectionSelect sections={SECTIONS} />
        </div>

        <div className="flex flex-col md:flex-row gap-gutter">
          <aside className="hidden md:block w-56 shrink-0 sticky top-28 h-fit">
            <p className="font-label-lg text-label-lg text-text-primary font-semibold uppercase tracking-wider mb-3">
              In This Guide
            </p>
            <nav className="flex flex-col gap-1 mb-6">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="px-3 py-2 rounded-lg font-body-sm text-body-sm text-text-secondary hover:bg-surface-secondary hover:text-brand-primary transition-colors"
                >
                  {s.title}
                </a>
              ))}
            </nav>
            <div className="border border-border-default rounded-xl p-5 bg-surface-elevated flex flex-col items-start gap-2">
              <span className="material-symbols-outlined text-brand-primary text-[26px]">support_agent</span>
              <p className="font-body-sm text-body-sm text-text-primary font-semibold">Still need help?</p>
              <p className="font-label-md text-label-md text-text-secondary">Our customer care team is here for you.</p>
              <Link
                href="/contact"
                className="mt-1 bg-brand-primary text-white font-button text-button px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                Contact Us
              </Link>
            </div>
          </aside>

          <div className="flex-grow min-w-0 flex flex-col gap-stack-lg">
            <section id="how-to-measure" className="scroll-mt-28">
              <h2 className="font-headline-lg text-headline-lg text-text-primary mb-stack-sm">1. How to Measure</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-bento-gap">
                {HOW_TO_MEASURE.map((m) => (
                  <div key={m.title} className="border border-border-default rounded-2xl p-6 bg-surface-elevated flex flex-col gap-2">
                    <span className="material-symbols-outlined text-brand-primary text-[26px]">{m.icon}</span>
                    <h3 className="font-headline-md text-headline-md text-text-primary">{m.title}</h3>
                    <p className="font-body-sm text-body-sm text-text-secondary">{m.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="clothing" className="scroll-mt-28">
              <h2 className="font-headline-lg text-headline-lg text-text-primary mb-stack-sm">2. Clothing Size Guide</h2>
              <div className="overflow-x-auto border border-border-default rounded-2xl">
                <table className="w-full text-left border-collapse min-w-[480px]">
                  <thead>
                    <tr className="bg-surface-secondary">
                      <th className="font-label-md text-label-md text-text-secondary uppercase tracking-wider px-4 py-3">Size Label</th>
                      <th className="font-label-md text-label-md text-text-secondary uppercase tracking-wider px-4 py-3">Age</th>
                      <th className="font-label-md text-label-md text-text-secondary uppercase tracking-wider px-4 py-3">Height</th>
                      <th className="font-label-md text-label-md text-text-secondary uppercase tracking-wider px-4 py-3">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AGE_SIZES.map((row, i) => (
                      <tr key={row.label} className={i % 2 === 0 ? "bg-surface-elevated" : "bg-surface-primary"}>
                        <td className="font-body-md text-body-md text-text-primary font-medium px-4 py-3 whitespace-nowrap">{row.label}</td>
                        <td className="font-body-sm text-body-sm text-text-secondary px-4 py-3 whitespace-nowrap">{row.age}</td>
                        <td className="font-body-sm text-body-sm text-text-secondary px-4 py-3 whitespace-nowrap">{row.height}</td>
                        <td className="font-body-sm text-body-sm text-text-secondary px-4 py-3 whitespace-nowrap">{row.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="footwear" className="scroll-mt-28">
              <h2 className="font-headline-lg text-headline-lg text-text-primary mb-stack-sm">3. Footwear Size Guide</h2>
              <div className="overflow-x-auto border border-border-default rounded-2xl">
                <table className="w-full text-left border-collapse min-w-[360px]">
                  <thead>
                    <tr className="bg-surface-secondary">
                      <th className="font-label-md text-label-md text-text-secondary uppercase tracking-wider px-4 py-3">Age</th>
                      <th className="font-label-md text-label-md text-text-secondary uppercase tracking-wider px-4 py-3">EU Size</th>
                      <th className="font-label-md text-label-md text-text-secondary uppercase tracking-wider px-4 py-3">Foot Length</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SHOE_SIZES.map((row, i) => (
                      <tr key={row.age} className={i % 2 === 0 ? "bg-surface-elevated" : "bg-surface-primary"}>
                        <td className="font-body-md text-body-md text-text-primary font-medium px-4 py-3 whitespace-nowrap">{row.age}</td>
                        <td className="font-body-sm text-body-sm text-text-secondary px-4 py-3 whitespace-nowrap">{row.eu}</td>
                        <td className="font-body-sm text-body-sm text-text-secondary px-4 py-3 whitespace-nowrap">{row.foot}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="tips" className="scroll-mt-28 bg-surface-elevated border border-border-default rounded-2xl p-6">
              <h2 className="font-headline-md text-headline-md text-text-primary mb-3">4. Measurement Tips</h2>
              <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-brand-primary text-[18px] shrink-0">check</span>
                  Between sizes? Choose the larger size, especially for growing newborns and toddlers.
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-brand-primary text-[18px] shrink-0">check</span>
                  Heights and weights are approximate — every child grows differently.
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-brand-primary text-[18px] shrink-0">check</span>
                  Measure your child in light clothing for the most accurate result.
                </li>
              </ul>
            </section>

            {/* Mobile-only support CTA (desktop version lives in the sidebar) */}
            <div className="md:hidden border border-border-default rounded-2xl p-6 bg-surface-elevated flex flex-col items-center text-center gap-2">
              <span className="material-symbols-outlined text-brand-primary text-[26px]">support_agent</span>
              <p className="font-body-sm text-body-sm text-text-primary font-semibold">Still need help?</p>
              <p className="font-label-md text-label-md text-text-secondary">Our customer care team is here for you.</p>
              <Link
                href="/contact"
                className="mt-1 bg-brand-primary text-white font-button text-button px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </main>
      <InternalTrustStrip />
    </>
  );
}
