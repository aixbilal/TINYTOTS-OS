"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

type FaqItem = {
  question: string;
  answer: ReactNode;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How long does delivery take?",
    answer:
      "2–3 business days in Punjab & Islamabad, 4–7 business days elsewhere in Pakistan.",
  },
  {
    question: "Do you accept Cash on Delivery?",
    answer: "Yes, COD is currently our only payment method. Card payments are coming soon.",
  },
  {
    question: "What's your return policy?",
    answer: (
      <>
        3 days from delivery, items unworn with tags attached. See our{" "}
        <Link href="/shipping-returns" className="text-primary font-medium hover:underline">
          Shipping &amp; Returns
        </Link>{" "}
        page for full details.
      </>
    ),
  },
  {
    question: "Is delivery free?",
    answer:
      "Yes, on all standard orders. Remote areas may have a small additional charge, shown at checkout.",
  },
  {
    question: "How can I get more help?",
    answer: (
      <>
        <Link href="/help" className="text-primary font-medium hover:underline">
          Visit our Help Center →
        </Link>
        , or email{" "}
        <a
          href="mailto:support@tinytotsofficial.com"
          className="text-primary font-medium hover:underline"
        >
          support@tinytotsofficial.com
        </a>
        .
      </>
    ),
  },
];

export default function FooterFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="w-full border-t border-outline-variant/20 bg-surface py-stack-md"
      aria-labelledby="footer-faq-heading"
    >
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="max-w-3xl mx-auto">
        <h2
          id="footer-faq-heading"
          className="font-headline-md text-headline-md text-on-surface text-center mb-stack-sm"
        >
          Common Questions
        </h2>
        <div className="flex flex-col border border-outline-variant/30 rounded-2xl overflow-hidden bg-surface-container-lowest">
          {FAQ_ITEMS.map((item, i) => {
            const open = openIndex === i;
            return (
              <div
                key={item.question}
                className={i > 0 ? "border-t border-outline-variant/20" : undefined}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                  aria-controls={`footer-faq-panel-${i}`}
                  id={`footer-faq-trigger-${i}`}
                  className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left font-body-md text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <span className="font-medium">{item.question}</span>
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">
                    {open ? "expand_less" : "expand_more"}
                  </span>
                </button>
                <div
                  id={`footer-faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`footer-faq-trigger-${i}`}
                  hidden={!open}
                  className="px-4 sm:px-5 pb-4 font-body-sm text-body-sm text-on-surface-variant leading-relaxed"
                >
                  {item.answer}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
}
