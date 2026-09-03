import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { htmlToPlainText } from "@/lib/html-text";
import { sanitizeContentHtml } from "@/lib/sanitize";
import {
  helpCategoryLabel,
  normalizeHelpCategory,
} from "@/lib/help-categories";
import { jsonLdScriptString } from "@/lib/json-ld";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import InternalTrustStrip from "@/components/InternalTrustStrip";

// Static-generate known help article slugs at build time, ISR-revalidate
// hourly — same pattern as blog/products/collections.
export const revalidate = 3600;

export async function generateStaticParams() {
  const { data } = await supabaseAdmin
    .from("help_articles")
    .select("slug")
    .eq("is_published", true);

  return (data || []).map((a) => ({ slug: a.slug }));
}

function sanitizeArticleHtml(html: string): string {
  return sanitizeContentHtml(html);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: article } = await supabaseAdmin
    .from("help_articles")
    .select("title, content, is_published")
    .eq("slug", slug)
    .maybeSingle();

  if (!article || !article.is_published) {
    return { title: "Help Center" };
  }

  const title = String(article.title || "").trim();
  const description =
    htmlToPlainText(article.content || "", 155) ||
    `${title} — TinyTots Help Center`;

  return pageMetadata({
    title,
    description,
    path: `/help/${slug}`,
    ogType: "article",
  });
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: article } = await supabaseAdmin
    .from("help_articles")
    .select("id, title, content, category, published_at, is_published")
    .eq("slug", slug)
    .single();

  if (!article || !article.is_published) {
    notFound();
  }

  const category = normalizeHelpCategory(article.category);
  const categoryLabel = helpCategoryLabel(category);

  const { data: related } = await supabaseAdmin
    .from("help_articles")
    .select("id, title, slug")
    .eq("is_published", true)
    .eq("category", category)
    .neq("id", article.id)
    .order("display_order", { ascending: true })
    .limit(5);

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonLdScriptString(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Help Center", path: "/help" },
            { name: String(article.title || "").trim(), path: `/help/${slug}` },
          ])
        ),
      }}
    />
    <div className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 font-body-sm text-body-sm text-text-secondary mb-stack-sm"
      >
        <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/help" className="font-medium text-brand-primary hover:underline">
          Help Center
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-text-secondary">{categoryLabel}</span>
        <span aria-hidden="true">/</span>
        <span className="text-text-primary truncate max-w-[min(100%,16rem)] sm:max-w-none">
          {article.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-gutter items-start">
        <article className="min-w-0">
          <header className="mb-stack-md">
            <span className="font-label-md text-label-md text-brand-primary uppercase tracking-wider mb-2 block">
              {categoryLabel}
            </span>
            <h1 className="font-display-xl text-[28px] md:text-[36px] text-text-primary tracking-tight leading-tight">
              {article.title}
            </h1>
          </header>

          <div
            className="w-full text-text-primary font-body-md text-body-md leading-relaxed
break-words [&_*]:max-w-full [&_*]:box-border
              [&_p]:mb-4 [&_p]:leading-relaxed
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-2
              [&_strong]:font-semibold [&_strong]:text-text-primary
[&_a]:text-brand-primary [&_a]:underline [&_a]:break-all"
            dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content) }}
          />

          {related && related.length > 0 && (
            <aside className="mt-stack-lg pt-stack-md border-t border-border-default">
              <h2 className="font-headline-lg text-headline-lg text-text-primary mb-3">
                Related in {categoryLabel}
              </h2>
              <ul className="flex flex-col gap-2">
                {related.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/help/${a.slug}`}
                      className="group flex items-center justify-between rounded-xl border border-border-default hover:border-brand-primary/40 px-4 py-3 transition-all"
                    >
                      <span className="font-body-md text-body-md text-text-primary group-hover:text-brand-primary transition-colors">
                        {a.title}
                      </span>
                      <span className="material-symbols-outlined text-brand-primary text-[18px] shrink-0 ml-3">arrow_forward</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </article>

        <aside className="flex flex-col gap-5 md:sticky md:top-28">
          <div className="border border-border-default rounded-xl p-5">
            <label className="sr-only" htmlFor="help-article-search">Search Help Center</label>
            <form action="/help" method="GET" className="flex items-center gap-2">
              <input
                id="help-article-search"
                type="search"
                name="q"
                placeholder="Search Help Center..."
                className="flex-1 border border-border-default rounded-lg px-3 py-2.5 font-body-sm text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </form>
          </div>

          <div className="border border-border-default rounded-xl p-5 flex flex-col gap-2">
            <Link
              href="/track-order"
              className="flex items-center gap-2 font-body-sm text-body-sm text-text-primary hover:text-brand-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-primary">local_shipping</span>
              Track Your Order
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2 font-body-sm text-body-sm text-text-primary hover:text-brand-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-primary">support_agent</span>
              Contact Support
            </Link>
          </div>
        </aside>
      </div>
    </div>
    <InternalTrustStrip />
    </>
  );
}
