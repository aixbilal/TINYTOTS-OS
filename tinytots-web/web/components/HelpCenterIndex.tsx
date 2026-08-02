"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
    <div className="w-full min-h-screen py-10 px-4 sm:px-6 max-w-3xl mx-auto">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl sm:text-5xl font-bold text-on-surface tracking-tight mb-3">
          Help Center
        </h1>
        <p className="text-on-surface-variant text-base sm:text-lg mb-6">
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
          className="w-full border border-outline-variant/50 rounded-xl px-4 py-3 bg-surface-container-lowest font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {articles.length === 0 && (
        <p className="text-on-surface-variant">No help articles published yet.</p>
      )}

      {articles.length > 0 && grouped.length === 0 && (
        <p className="text-on-surface-variant">
          No articles match &ldquo;{query.trim()}&rdquo;.
        </p>
      )}

      {grouped.map((group) => (
        <div key={group.value} className="mb-8">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold text-on-surface">{group.label}</h2>
            <span className="text-xs text-on-surface-variant tabular-nums">
              {group.items.length} {group.items.length === 1 ? "article" : "articles"}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {group.items.map((a) => (
              <Link
                key={a.id}
                href={`/help/${a.slug}`}
                className="group flex items-center justify-between rounded-2xl bg-surface border border-outline-variant/30 hover:border-primary/40 hover:shadow-sm transition-all px-5 py-4"
              >
                <span className="font-medium text-on-surface group-hover:text-primary transition-colors">
                  {a.title}
                </span>
                <span className="text-primary text-sm shrink-0 ml-3">→</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
