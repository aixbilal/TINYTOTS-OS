"use client";

import { useEffect, useState, type ReactNode } from "react";
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
        7 days from delivery, items unworn with tags attached. See our{" "}
        <Link href="/shipping-returns" className="text-brand-primary font-medium hover:underline">
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
        <Link href="/help" className="text-brand-primary font-medium hover:underline">
          Visit our Help Center →
        </Link>
        , or email{" "}
        <a
          href="mailto:support@tinytotsofficial.com"
          className="text-brand-primary font-medium hover:underline"
        >
          support@tinytotsofficial.com
        </a>
        .
      </>
    ),
  },
];

const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const DURATION_MS = 650;

/** Homepage, Shop All (/products), and collection/category pages only. */
export function shouldShowFooterFaq(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === "/") return true;
  if (pathname === "/products") return true;
  if (pathname.startsWith("/collections/")) return true;
  return false;
}

export default function FooterFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <>
      <div
        aria-hidden={!isOpen}
        onClick={() => setOpenIndex(null)}
        className={`fixed inset-0 z-[40] bg-surface-inverse/25 transition-opacity ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ transitionDuration: `${DURATION_MS}ms`, transitionTimingFunction: EASE }}
      />

      {/* No top border / divider — section blends into page */}
      <section
        className={`relative w-full bg-surface-canvas py-stack-md ${isOpen ? "z-[45]" : "z-0"}`}
        aria-labelledby="footer-faq-heading"
      >
        <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <h2
            id="footer-faq-heading"
            className="font-headline-md text-headline-md text-text-primary text-center mb-stack-sm"
          >
            Common Questions
          </h2>

          <ul className="w-full flex flex-col gap-3 list-none m-0 p-0">
            {FAQ_ITEMS.map((item, i) => {
              const open = openIndex === i;
              return (
                <li
                  key={item.question}
                  className="relative"
                  style={{
                    zIndex: open ? 2 : 1,
                    transition: `opacity ${DURATION_MS}ms ${EASE}`,
                    opacity: isOpen && !open ? 0.35 : 1,
                  }}
                >
                  <div
                    className="rounded-2xl bg-surface-elevated will-change-transform"
                    style={{
                      // Shadow only — no border lines that “pop” during scale
                      boxShadow: open
                        ? "0 18px 40px rgba(28, 25, 23, 0.14), 0 4px 12px rgba(28, 25, 23, 0.06)"
                        : "0 1px 3px rgba(28, 25, 23, 0.06)",
                      transform: open ? "scale(1.035)" : "scale(1)",
                      transformOrigin: "center center",
                      transition: [
                        `transform ${DURATION_MS}ms ${EASE}`,
                        `box-shadow ${DURATION_MS}ms ${EASE}`,
                      ].join(", "),
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(open ? null : i)}
                      aria-expanded={open}
                      aria-controls={`footer-faq-panel-${i}`}
                      id={`footer-faq-trigger-${i}`}
                      className="w-full flex items-center justify-between gap-4 px-5 md:px-7 text-left text-text-primary"
                      style={{
                        paddingTop: open ? "1.5rem" : "1.15rem",
                        paddingBottom: open ? "0.5rem" : "1.15rem",
                        transition: `padding ${DURATION_MS}ms ${EASE}`,
                      }}
                    >
                      <span
                        className="font-medium"
                        style={{
                          fontSize: open ? "1.125rem" : "1rem",
                          transition: `font-size ${DURATION_MS}ms ${EASE}`,
                        }}
                      >
                        {item.question}
                      </span>
                      <span
                        className="material-symbols-outlined shrink-0 text-text-secondary"
                        style={{
                          fontSize: open ? 26 : 22,
                          transform: open ? "rotate(180deg)" : "rotate(0deg)",
                          transition: `transform ${DURATION_MS}ms ${EASE}, font-size ${DURATION_MS}ms ${EASE}`,
                        }}
                      >
                        expand_more
                      </span>
                    </button>

                    <div
                      id={`footer-faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`footer-faq-trigger-${i}`}
                      style={{
                        display: "grid",
                        gridTemplateRows: open ? "1fr" : "0fr",
                        transition: `grid-template-rows ${DURATION_MS}ms ${EASE}`,
                      }}
                    >
                      <div className="overflow-hidden min-h-0">
                        <div
                          className="px-5 md:px-7 font-body-sm text-body-sm md:text-base text-text-secondary leading-relaxed"
                          style={{
                            paddingBottom: open ? "1.5rem" : 0,
                            opacity: open ? 1 : 0,
                            transition: [
                              `opacity ${DURATION_MS}ms ${EASE}`,
                              `padding ${DURATION_MS}ms ${EASE}`,
                            ].join(", "),
                          }}
                        >
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
