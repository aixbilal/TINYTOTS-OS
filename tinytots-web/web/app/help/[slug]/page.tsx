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
import { absoluteUrl } from "@/lib/site-url";

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

  const description =
    htmlToPlainText(article.content || "", 155) ||
    `${article.title} — TinyTots Help Center`;
  const title = article.title;
  const url = absoluteUrl(`/help/${slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
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
    <div className="w-full max-w-full overflow-x-hidden py-8 px-4 sm:px-6">
      <article className="w-full max-w-2xl mx-auto">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-sm text-on-surface-variant mb-6"
        >
          <Link href="/help" className="font-medium text-primary hover:underline">
            Help Center
          </Link>
          <span aria-hidden="true" className="text-on-surface-variant/60">
            /
          </span>
          <span className="text-on-surface-variant">{categoryLabel}</span>
          <span aria-hidden="true" className="text-on-surface-variant/60">
            /
          </span>
          <span className="text-on-surface truncate max-w-[min(100%,16rem)] sm:max-w-none">
            {article.title}
          </span>
        </nav>

        <header className="mb-6">
          <p className="text-xs sm:text-sm text-primary uppercase tracking-wider font-semibold mb-2">
            {categoryLabel}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight leading-tight">
            {article.title}
          </h1>
        </header>

        <div
          className="w-full text-on-surface text-base leading-relaxed space-y-4 pt-2
break-words [&_*]:max-w-full [&_*]:box-border
            [&_p]:mb-4 [&_p]:leading-relaxed
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-2
            [&_strong]:font-semibold [&_strong]:text-on-surface
[&_a]:text-primary [&_a]:underline [&_a]:break-all"
          dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content) }}
        />

        {related && related.length > 0 && (
          <aside className="mt-10 pt-8 border-t border-outline-variant/30">
            <h2 className="text-lg font-bold text-on-surface mb-3">
              Related in {categoryLabel}
            </h2>
            <ul className="flex flex-col gap-2">
              {related.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/help/${a.slug}`}
                    className="group flex items-center justify-between rounded-xl border border-outline-variant/30 hover:border-primary/40 px-4 py-3 transition-all"
                  >
                    <span className="font-medium text-on-surface group-hover:text-primary transition-colors">
                      {a.title}
                    </span>
                    <span className="text-primary text-sm shrink-0 ml-3">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </article>
    </div>
  );
}
