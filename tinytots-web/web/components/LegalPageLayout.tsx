"use client";

import { useEffect, useRef, useState } from "react";

type Section = { id: string; title: string };

export default function LegalPageLayout({
  title,
  lastUpdated,
  sections,
  children,
}: {
  title: string;
  lastUpdated: string;
  sections: Section[];
  children: React.ReactNode;
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
    <main className="max-w-container-max mx-auto w-full py-stack-lg flex flex-col md:flex-row gap-gutter">
      <aside className="hidden md:block w-56 shrink-0 sticky top-28 h-fit">
        <p className="font-label-lg text-label-lg text-text-primary font-semibold uppercase tracking-wider mb-3">
          Contents
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
        <h1 className="font-display-md text-display-md text-text-primary mb-2">{title}</h1>
        <p className="font-label-md text-label-md text-text-secondary mb-stack-lg">
          Last updated: {lastUpdated}
        </p>
        <div className="flex flex-col gap-stack-lg">{children}</div>
      </div>
    </main>
  );
}