import Link from "next/link";

export default function LegalContactCta({ pageLabel }: { pageLabel: string }) {
  return (
    <div className="border border-border-default rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-primary/[0.04]">
      <div>
        <h3 className="font-headline-md text-headline-md text-text-primary mb-1">
          Have questions about our {pageLabel}?
        </h3>
        <p className="font-body-sm text-body-sm text-text-secondary">
          Our support team is happy to help with anything not covered here.
        </p>
      </div>
      <Link
        href="/contact"
        className="shrink-0 bg-brand-primary text-white font-button text-button px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
      >
        Contact Us
      </Link>
    </div>
  );
}
