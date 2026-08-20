"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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

export type HelpPageContent = {
  hero_image_url: string;
  hero_image_url_mobile: string;
  hero_eyebrow: string;
  hero_headline: string;
  hero_subtext: string;
  support_image_url: string;
};

// Real existing categories, grouped into the 6 topic-card labels the
// finalized reference uses. "General FAQ" has no distinct category of its
// own in the schema (unmatched values default to "orders") so it's wired
// as a catch-all link into the full article list below, not a fabricated
// 7th category.
const TOPIC_CARDS: {
  label: string;
  subtitle: string;
  icon: string;
  categories: HelpCategoryValue[];
  anchor: string;
}[] = [
  { label: "Orders & Shipping", subtitle: "Track orders, delivery times & shipping info.", icon: "local_shipping", categories: ["orders", "shipping"], anchor: "category-orders" },
  { label: "Returns & Exchanges", subtitle: "Easy returns, exchanges & refund info.", icon: "assignment_return", categories: ["returns"], anchor: "category-returns" },
  { label: "Products & Care", subtitle: "Sizing, fit & product care info.", icon: "checkroom", categories: ["sizing"], anchor: "category-sizing" },
  { label: "Payments & Offers", subtitle: "Payment methods & order costs.", icon: "credit_card", categories: ["payments"], anchor: "category-payments" },
  { label: "Account & Settings", subtitle: "Manage your account & preferences.", icon: "person", categories: ["account"], anchor: "category-account" },
  { label: "General FAQ", subtitle: "Browse every article at once.", icon: "quiz", categories: [], anchor: "browse-articles" },
];

// Real articles hand-picked for visibility on the homepage of Help Center -
// an honest editorial curation (see master-batch spec), not a claim of
// analytics-driven ranking. Falls back gracefully if a slug isn't found.
const POPULAR_HELP_SLUGS = [
  "how-do-i-track-my-order",
  "whats-your-return-policy",
  "how-do-i-know-what-size-to-order",
  "how-do-i-contact-tiny-tots-directly",
];

export default function HelpCenterIndex({
  articles,
  content,
}: {
  articles: HelpIndexArticle[];
  content: HelpPageContent;
}) {
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

  const popularArticles = useMemo(() => {
    const bySlug = new Map(articles.map((a) => [a.slug, a]));
    return POPULAR_HELP_SLUGS.map((s) => bySlug.get(s)).filter(
      (a): a is HelpIndexArticle => Boolean(a)
    );
  }, [articles]);

  function scrollToAnchor(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {/* Hero — same full-bleed + gradient-panel pattern as Shop/About/Blog,
          with a dedicated search bar (unique to Help). Uses the new
          help_page_content.hero_image_url field - never falls back to
          another page's asset; shows a clean placeholder if unset. */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 aspect-[4/5] sm:aspect-[21/9] mb-stack-lg overflow-hidden bg-surface-canvas">
        {content.hero_image_url_mobile ? (
          <Image src={content.hero_image_url_mobile} alt="" fill sizes="100vw" priority className="object-cover sm:hidden" />
        ) : (
          <div className="absolute inset-0 sm:hidden bg-surface-secondary" />
        )}
        {content.hero_image_url ? (
          <Image
            src={content.hero_image_url}
            alt=""
            fill
            sizes="100vw"
            priority
            className={`object-cover ${content.hero_image_url_mobile ? "hidden sm:block" : ""}`}
          />
        ) : (
          <div className={`absolute inset-0 bg-surface-secondary ${content.hero_image_url_mobile ? "hidden sm:block" : ""}`} />
        )}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(250,247,242,0.92) 0%, rgba(250,247,242,0.55) 40%, rgba(250,247,242,0) 65%)",
          }}
        />
        <div className="absolute inset-0 z-[2] flex flex-col justify-center px-6 sm:px-10 md:px-16">
          <div className="max-w-md w-full">
            <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-3 block">
              {content.hero_eyebrow}
            </span>
            <h1 className="font-display-xl text-[30px] sm:text-[36px] md:text-[44px] text-text-primary leading-[1.15] tracking-tight mb-4">
              {content.hero_headline}
            </h1>
            <p className="font-body-md text-body-md text-text-secondary max-w-sm mb-5">{content.hero_subtext}</p>
            <label className="sr-only" htmlFor="help-search">
              Search help articles
            </label>
            <div className="relative w-full max-w-sm">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">
                search
              </span>
              <input
                id="help-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for help articles..."
                maxLength={100}
                className="w-full border border-border-default rounded-full pl-11 pr-4 py-3.5 bg-surface-elevated font-body-md text-body-md text-text-primary placeholder:text-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-brand-primary shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <nav className="font-body-sm text-body-sm text-text-secondary mb-stack-md flex items-center gap-2">
          <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-text-primary">Help Center</span>
        </nav>

        {/* Browse by Topic */}
        <section className="mb-stack-lg">
          <h2 className="font-label-lg text-label-lg uppercase tracking-wide text-text-primary mb-stack-sm">
            Browse by Topic
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {TOPIC_CARDS.map((card) => (
              <button
                key={card.label}
                type="button"
                onClick={() => scrollToAnchor(card.anchor)}
                className="flex flex-col items-start text-left gap-2 border border-border-default rounded-xl bg-surface-elevated hover:border-brand-primary/40 hover:shadow-sm transition-all px-4 py-5"
              >
                <span className="material-symbols-outlined text-brand-primary text-[26px]">{card.icon}</span>
                <span className="font-headline-md text-headline-md text-text-primary">{card.label}</span>
                <span className="font-label-md text-label-md text-text-secondary">{card.subtitle}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Popular Help Topics + Need More Help */}
        <section className="mb-stack-lg grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-gutter items-stretch">
          {popularArticles.length > 0 && (
            <div className="min-w-0">
              <div className="flex items-baseline justify-between mb-stack-sm">
                <h2 className="font-label-lg text-label-lg uppercase tracking-wide text-text-primary">
                  Popular Help Topics
                </h2>
                <button
                  type="button"
                  onClick={() => scrollToAnchor("browse-articles")}
                  className="font-label-md text-label-md text-brand-primary hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {popularArticles.map((a) => (
                  <Link
                    key={a.id}
                    href={`/help/${a.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-xl bg-surface-elevated border border-border-default hover:border-brand-primary/40 transition-all px-4 py-3.5"
                  >
                    <span className="font-body-sm text-body-sm text-text-primary group-hover:text-brand-primary transition-colors">
                      {a.title}
                    </span>
                    <span className="material-symbols-outlined text-text-secondary text-[18px] shrink-0">chevron_right</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="min-w-0 relative flex flex-col sm:flex-row items-stretch overflow-hidden rounded-xl border border-border-default bg-surface-elevated">
            <div className="relative w-full sm:w-2/5 aspect-[4/3] sm:aspect-auto shrink-0 bg-surface-secondary">
              {content.support_image_url ? (
                <Image src={content.support_image_url} alt="" fill sizes="(max-width: 640px) 100vw, 40vw" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-text-secondary/40">
                  <span className="material-symbols-outlined text-[36px]">support_agent</span>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-3 p-6">
              <h2 className="font-display-xl text-[22px] md:text-[26px] text-text-primary tracking-tight">
                Need more help?
              </h2>
              <p className="font-body-sm text-body-sm text-text-secondary">
                Our support team is happy to help with anything not covered here.
              </p>
              <div className="flex flex-wrap gap-3 mt-1">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-brand-primary text-white font-button text-button px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Contact Us
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
                <Link
                  href="/report-issue"
                  className="inline-flex items-center gap-2 border border-border-default text-text-primary font-button text-button px-5 py-2.5 rounded-lg hover:border-brand-primary transition-colors"
                >
                  Report an Issue
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Full article list, grouped by category - same search box drives this too */}
        <section id="browse-articles" className="mb-stack-lg scroll-mt-28">
          <h2 className="font-label-lg text-label-lg uppercase tracking-wide text-text-primary mb-stack-sm">
            All Articles
          </h2>

          {articles.length === 0 && (
            <p className="font-body-md text-body-md text-text-secondary">No help articles published yet.</p>
          )}

          {articles.length > 0 && grouped.length === 0 && (
            <p className="font-body-md text-body-md text-text-secondary">
              No articles match &ldquo;{query.trim()}&rdquo;.
            </p>
          )}

          {grouped.map((group) => (
            <div key={group.value} id={`category-${group.value}`} className="mb-stack-md scroll-mt-28">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h3 className="font-headline-lg text-headline-lg text-text-primary">{group.label}</h3>
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
        </section>
      </div>
      <InternalTrustStrip />
    </>
  );
}
