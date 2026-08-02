import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeQuillHtml } from "@/lib/html-text";

export const dynamic = "force-dynamic";

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

  return (
    <div className="w-full max-w-full overflow-x-hidden py-8 px-4 sm:px-6">
      <article className="w-full max-w-2xl mx-auto">
        <Link
          href="/help"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-6"
        >
          ← Back to Help Center
        </Link>

        <header className="mb-6">
          <p className="text-xs sm:text-sm text-primary uppercase tracking-wider font-semibold mb-2">
            {article.category}
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
          dangerouslySetInnerHTML={{ __html: normalizeQuillHtml(article.content) }}
        />
      </article>
    </div>
  );
}