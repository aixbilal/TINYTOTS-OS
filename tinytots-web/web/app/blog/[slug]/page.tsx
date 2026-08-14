import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { htmlToPlainText } from "@/lib/html-text";
import { sanitizeContentHtml } from "@/lib/sanitize";
import { absoluteUrl } from "@/lib/site-url";

// Static-generate known blog post slugs at build time, ISR-revalidate every
// 60s — same trade-off as products/collections. This was the single worst
// route in production (P75 1.94s, 0% cache hit rate).
export const revalidate = 60;

export async function generateStaticParams() {
  const { data } = await supabaseAdmin
    .from("blog_posts")
    .select("slug")
    .eq("is_published", true);

  return (data || []).map((p) => ({ slug: p.slug }));
}

function sanitizePostHtml(html: string): string {
  return sanitizeContentHtml(html);
}

// Explicit locale + UTC timezone so server-render and client-hydrate always
// produce an identical string — plain .toLocaleDateString() was picking up
// whatever locale/timezone each environment defaulted to, causing hydration
// mismatch (#418).
function formatBlogDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await supabaseAdmin
    .from("blog_posts")
    .select("title, content, featured_image_url, is_published")
    .eq("slug", slug)
    .maybeSingle();

  if (!post || !post.is_published) {
    return { title: "Blog" };
  }

  const description =
    htmlToPlainText(post.content || "", 155) || `${post.title} — TinyTots Blog`;
  const title = post.title;
  const url = absoluteUrl(`/blog/${slug}`);
  const image = post.featured_image_url || undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: post } = await supabaseAdmin
    .from("blog_posts")
    .select("id, title, author, content, featured_image_url, published_at, is_published")
    .eq("slug", slug)
    .single();

  if (!post || !post.is_published) {
    notFound();
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden py-8 px-4 sm:px-6">
      <article className="w-full max-w-3xl mx-auto">
        {/* Navigation Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline mb-6"
        >
          ← Back to Blog
        </Link>

        {/* 1. Featured Image ABOVE Title */}
        {post.featured_image_url && (
          <div className="mb-6 rounded-2xl overflow-hidden border border-border-default shadow-sm">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-auto max-h-[420px] object-cover"
            />
          </div>
        )}

        {/* 2. Header: Title & Metadata */}
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight leading-tight mb-2">
            {post.title}
          </h1>

          <p className="text-xs sm:text-sm text-brand-primary uppercase tracking-wider font-semibold">
            By {post.author || "TinyTots Editorial"} ·{" "}
            {post.published_at ? formatBlogDate(post.published_at) : ""}
          </p>
        </header>

        {/* 3. Text Content (Controlled Size) */}
        <div
          className="w-full text-text-primary text-base leading-relaxed space-y-4 pt-2
break-words [&_*]:max-w-full [&_*]:box-border
            [&_p]:mb-4 [&_p]:leading-relaxed
            [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-2
            [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-2
            [&_strong]:font-semibold [&_strong]:text-text-primary
[&_a]:text-brand-primary [&_a]:underline [&_a]:break-all
            [&_img]:rounded-xl [&_img]:my-6 [&_img]:h-auto"
          dangerouslySetInnerHTML={{ __html: sanitizePostHtml(post.content) }}
        />
      </article>
    </div>
  );
}
