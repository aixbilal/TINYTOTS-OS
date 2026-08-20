"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import InternalTrustStrip from "@/components/InternalTrustStrip";

type Section = { id: string; title: string };

export default function LegalPageLayout({
  title,
  lastUpdated,
  intro,
  sections,
  children,
  heroIcon = "gavel",
}: {
  title: string;
  lastUpdated: string;
  intro?: string;
  sections: Section[];
  children: React.ReactNode;
  /** Material Symbols icon shown in the decorative hero panel - lets Terms
      (gavel) and Privacy (shield) read as distinct pages, not a reused
      generic asset. */
  heroIcon?: string;
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current!.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, [sections]);

  return (
    <>
      <div className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop pt-stack-md">
        <nav className="font-body-sm text-body-sm text-text-secondary mb-stack-sm flex items-center gap-2">
          <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-text-primary">{title}</span>
        </nav>

        {/* Decorative visual, page-specific static illustration (not
            Admin-editable - a fixed design accent, not a content banner
            per Section 21's "fixed design illustration acceptable as a
            dedicated static repo asset" allowance). */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-gutter items-start mb-stack-lg">
          <div>
            <h1 className="font-display-xl text-display-md text-text-primary mb-2">{title}</h1>
            <p className="font-label-md text-label-md text-text-secondary mb-3">
              Last updated: {lastUpdated}
            </p>
            {intro && (
              <p className="font-body-md text-body-md text-text-secondary max-w-2xl leading-relaxed">
                {intro}
              </p>
            )}
          </div>
          <div className="hidden md:block relative aspect-[4/5] rounded-[16px] overflow-hidden bg-brand-primary/[0.06]">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-[48px] text-brand-primary/30">{heroIcon}</span>
            </div>
          </div>
        </div>

        {/* Mobile: compact jump nav instead of a permanent narrow sidebar. */}
        <div className="md:hidden mb-stack-md">
          <label className="font-label-md text-label-md text-text-secondary mb-1 block">On this page</label>
          <select
            onChange={(e) => {
              const el = document.getElementById(e.target.value);
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="w-full border border-border-default rounded-lg px-3 py-2.5 font-body-sm text-body-sm text-text-primary bg-white"
            defaultValue=""
          >
            <option value="" disabled>Jump to a section...</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-gutter">
          <aside className="hidden md:block w-56 shrink-0 sticky top-28 h-fit">
            <p className="font-label-lg text-label-lg text-text-primary font-semibold uppercase tracking-wider mb-3">
              On This Page
            </p>
            <nav className="flex flex-col gap-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`px-3 py-2 rounded-lg font-body-sm text-body-sm transition-colors ${
                    activeId === s.id
                      ? "bg-brand-primary/20 text-brand-primary font-medium"
                      : "text-text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="flex-grow min-w-0 max-w-3xl">
            <div className="flex flex-col gap-stack-lg">{children}</div>
          </div>
        </div>
      </div>

      <div className="mt-stack-lg">
        <InternalTrustStrip />
      </div>
    </>
  );
}
