"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import InternalTrustStrip from "@/components/InternalTrustStrip";
import {
  HELP_CATEGORIES,
  normalizeHelpCategory,
  type HelpCategoryValue,
} from "@/lib/help-categories";

export type HelpIndexArticle = {
  id: number;
  title: string;
  slug: string;
  category: string;
};

export default function HelpCenterIndex({ articles }: { articles: HelpIndexArticle[] }) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? articles.filter((a) => a.title.toLowerCase().includes(needle))
      : articles;

    const byCat = new Map<HelpCategoryValue, HelpIndexArticle[]>();
    for (const a of filtered) {
      const key = normalizeHelpCategory(a.category);
      const list = byCat.get(key) || [];
      list.push(a);
      byCat.set(key, list);
    }

    return HELP_CATEGORIES.map((c) => ({
      ...c,
      items: byCat.get(c.value) || [],
    })).filter((g) => g.items.length > 0);
  }, [articles, query]);

  return (
    <>
    <div className="w-full max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <nav className="font-body-sm text-body-sm text-text-secondary mb-stack-sm flex items-center gap-2">
        <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-text-primary">Help Center</span>
      </nav>

      <div className="mb-stack-lg text-center sm:text-left">
        <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-2 block">
          Help Center
        </span>
        <h1 className="font-display-xl text-display-md text-text-primary tracking-tight mb-3">
          How can we help you?
        </h1>
        <p className="font-body-md text-body-md text-text-secondary mb-6">
          Answers to common questions about orders, delivery, and returns.
        </p>
        <label className="sr-only" htmlFor="help-search">
          Search help articles
        </label>
        <input
          id="help-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          maxLength={100}
          className="w-full border border-border-default rounded-xl px-4 py-3.5 bg-surface-elevated font-body-md text-body-md text-text-primary placeholder:text-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {articles.length === 0 && (
        <p className="font-body-md text-body-md text-text-secondary">No help articles published yet.</p>
      )}

      {articles.length > 0 && grouped.length === 0 && (
        <p className="font-body-md text-body-md text-text-secondary">
          No articles match &ldquo;{query.trim()}&rdquo;.
        </p>
      )}

      {grouped.map((group) => (
        <div key={group.value} className="mb-stack-md">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h2 className="font-headline-lg text-headline-lg text-text-primary">{group.label}</h2>
            <span className="font-label-md text-label-md text-text-secondary tabular-nums">
              {group.items.length} {group.items.length === 1 ? "article" : "articles"}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {group.items.map((a) => (
              <Link
                key={a.id}
                href={`/help/${a.slug}`}
                className="group flex items-center justify-between rounded-xl bg-surface-elevated border border-border-default hover:border-brand-primary/40 hover:shadow-sm transition-all px-5 py-4"
              >
                <span className="font-body-md text-body-md text-text-primary group-hover:text-brand-primary transition-colors">
                  {a.title}
                </span>
                <span className="material-symbols-outlined text-brand-primary text-[18px] shrink-0 ml-3">arrow_forward</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-stack-lg border border-border-default rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-primary/[0.04]">
        <div>
          <h3 className="font-headline-md text-headline-md text-text-primary mb-1">Still need help?</h3>
          <p className="font-body-sm text-body-sm text-text-secondary">Our team is happy to help with anything not covered here.</p>
        </div>
        <Link
          href="/contact"
          className="shrink-0 bg-brand-primary text-white font-button text-button px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Contact Us
        </Link>
      </div>
    </div>
    <div className="mt-stack-lg">
      <InternalTrustStrip />
    </div>
    </>
  );
}
