import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { htmlToPlainText } from "@/lib/html-text";
import { sanitizeContentHtml } from "@/lib/sanitize";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
import { jsonLdScriptString } from "@/lib/json-ld";
import { pageMetadata, breadcrumbJsonLd, SITE_NAME, orgId } from "@/lib/seo";
import BlogSubscribeForm from "@/components/BlogSubscribeForm";

// Cloudflare/OpenNext static-assets incremental cache can't honor `revalidate`
// (read-only) — render dynamically so post edits publish without a redeploy.
export const dynamic = "force-dynamic";

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

/**
 * A byline that is the brand itself or an editorial-desk label ("TinyTots
 * Editorial", "TinyTots Team") is the Organization, not a named individual —
 * never invent a Person for it.
 */
function authorNode(raw: unknown) {
  const name = String(raw ?? "").trim();
  const isOrg =
    !name ||
    /(^|\s)(editorial|team|staff)$/i.test(name) ||
    name.toLowerCase() === SITE_NAME.toLowerCase();
  return isOrg
    ? { "@type": "Organization", "@id": orgId(), name: SITE_NAME }
    : { "@type": "Person", name };
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

  const title = String(post.title || "").trim();
  const description =
    htmlToPlainText(post.content || "", 155) || `${title} — TinyTots Blog`;

  return pageMetadata({
    title,
    description,
    path: `/blog/${slug}`,
    ogType: "article",
    image: post.featured_image_url || null,
    imageAlt: title,
  });
}

function readingTimeMinutes(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: post } = await supabaseAdmin
    .from("blog_posts")
    .select(
      "id, title, author, content, featured_image_url, category, published_at, is_published"
    )
    .eq("slug", slug)
    .single();

  if (!post || !post.is_published) {
    notFound();
  }

  const canonical = absoluteUrl(`/blog/${slug}`);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: String(post.title || "").trim(),
    description: htmlToPlainText(post.content || "", 200) || undefined,
    image: post.featured_image_url ? [post.featured_image_url] : undefined,
    datePublished: post.published_at || undefined,
    mainEntityOfPage: canonical,
    url: canonical,
    author: authorNode(post.author),
    publisher: {
      "@type": "Organization",
      "@id": orgId(),
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${getSiteUrl()}/icon.png` },
    },
  };
  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: String(post.title || "").trim(), path: `/blog/${slug}` },
  ]);

  const { data: relatedRaw } = await supabaseAdmin
    .from("blog_posts")
    .select("id, title, slug, featured_image_url, published_at")
    .eq("is_published", true)
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(3);
  const related = relatedRaw || [];

  // Prev/Next within the same real published order the /blog listing uses
  // (newest first) - no fabricated adjacency, just the actual publish order.
  const { data: allSlugsRaw } = await supabaseAdmin
    .from("blog_posts")
    .select("id, slug, title")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  const allSlugs = allSlugsRaw || [];
  const currentIdx = allSlugs.findIndex((p) => p.id === post.id);
  const newerPost = currentIdx > 0 ? allSlugs[currentIdx - 1] : null;
  const olderPost = currentIdx >= 0 && currentIdx < allSlugs.length - 1 ? allSlugs[currentIdx + 1] : null;

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptString(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptString(breadcrumbLd) }}
      />
      <nav className="font-label-md text-label-md text-text-secondary mb-stack-sm flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-brand-primary">Home</Link>
        <span>›</span>
        <Link href="/blog" className="hover:text-brand-primary">Blog</Link>
        {post.category && (
          <>
            <span>›</span>
            <Link href={`/blog?category=${encodeURIComponent(post.category)}`} className="hover:text-brand-primary">
              {post.category}
            </Link>
          </>
        )}
        <span>›</span>
        <span className="text-text-primary">{post.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-stack-md items-start">
        <article className="min-w-0">
          {post.category && (
            <span className="font-label-md text-label-md uppercase tracking-wider text-brand-primary mb-2 block">
              {post.category}
            </span>
          )}
          <h1 className="font-display-xl text-[28px] md:text-[36px] text-text-primary tracking-tight leading-[1.15] mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 font-label-md text-label-md text-text-secondary mb-6">
            {post.published_at && <span>{formatBlogDate(post.published_at)}</span>}
            <span>·</span>
            <span>{readingTimeMinutes(post.content)} min read</span>
            <span>·</span>
            <span>By {post.author || "TinyTots Team"}</span>
          </div>

          {post.featured_image_url && (
            <div className="mb-6 overflow-hidden">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-auto max-h-[420px] object-cover"
              />
            </div>
          )}

          <div
            className="w-full text-text-primary font-body-md text-body-md leading-relaxed space-y-4
break-words [&_*]:max-w-full [&_*]:box-border
              [&_p]:mb-4 [&_p]:leading-relaxed
              [&_h1]:font-display-xl [&_h1]:text-[22px] [&_h1]:mt-6 [&_h1]:mb-2
              [&_h2]:font-display-xl [&_h2]:text-[19px] [&_h2]:mt-6 [&_h2]:mb-2
              [&_h3]:font-headline-md [&_h3]:text-headline-md [&_h3]:mt-4 [&_h3]:mb-2
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-2
              [&_strong]:font-semibold [&_strong]:text-text-primary
[&_a]:text-brand-primary [&_a]:underline [&_a]:break-all
              [&_img]:my-6 [&_img]:h-auto"
            dangerouslySetInnerHTML={{ __html: sanitizePostHtml(post.content) }}
          />

          <div className="mt-8 pt-6 border-t border-border-default flex items-center gap-3">
            <span className="font-label-md text-label-md text-text-secondary">Share this post:</span>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absoluteUrl(`/blog/${slug}`))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full border border-border-default flex items-center justify-center text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-colors"
              aria-label="Share on Facebook"
            >
              <span className="material-symbols-outlined text-[16px]">thumb_up</span>
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(absoluteUrl(`/blog/${slug}`))}`}
              className="w-8 h-8 rounded-full border border-border-default flex items-center justify-center text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-colors"
              aria-label="Share via email"
            >
              <span className="material-symbols-outlined text-[16px]">mail</span>
            </a>
          </div>

          {(olderPost || newerPost) && (
            <div className="mt-6 pt-6 border-t border-border-default flex items-center justify-between gap-4">
              {olderPost ? (
                <Link
                  href={`/blog/${olderPost.slug}`}
                  className="min-w-0 group flex items-center gap-1.5 font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] shrink-0">arrow_back</span>
                  <span className="truncate">{olderPost.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {newerPost && (
                <Link
                  href={`/blog/${newerPost.slug}`}
                  className="min-w-0 group flex items-center gap-1.5 font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors text-right ml-auto"
                >
                  <span className="truncate">{newerPost.title}</span>
                  <span className="material-symbols-outlined text-[18px] shrink-0">arrow_forward</span>
                </Link>
              )}
            </div>
          )}
        </article>

        <aside className="min-w-0 flex flex-col gap-6">
          <div className="bg-surface-elevated border border-border-default p-5">
            <h3 className="font-label-lg text-label-lg uppercase tracking-wide text-text-primary mb-3">
              About the Author
            </h3>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <p className="font-body-sm text-body-sm text-text-primary font-semibold">
                {post.author || "TinyTots Team"}
              </p>
            </div>
            <p className="font-body-sm text-body-sm text-text-secondary">
              Sharing stories, style guides, and care tips from the TinyTots family.
            </p>
          </div>

          {related.length > 0 && (
            <div className="bg-surface-elevated border border-border-default p-5">
              <h3 className="font-label-lg text-label-lg uppercase tracking-wide text-text-primary mb-3">
                Related Posts
              </h3>
              <div className="flex flex-col gap-3">
                {related.map((r) => (
                  <Link key={r.id} href={`/blog/${r.slug}`} className="flex gap-3 group">
                    <div className="relative w-16 h-16 shrink-0 overflow-hidden bg-surface-secondary">
                      {r.featured_image_url ? (
                        <img src={r.featured_image_url} alt="" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="font-body-sm text-body-sm text-text-primary group-hover:text-brand-primary transition-colors line-clamp-2">
                        {r.title}
                      </p>
                      {r.published_at && (
                        <p className="font-label-md text-label-md text-text-secondary mt-1">
                          {formatBlogDate(r.published_at)}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/blog"
                className="mt-4 block text-center border border-brand-primary text-brand-primary font-button text-button py-2.5 hover:bg-brand-primary hover:text-white transition-colors"
              >
                View All Articles
              </Link>
            </div>
          )}

          <div className="bg-brand-primary/[0.06] p-5">
            <h3 className="font-label-lg text-label-lg uppercase tracking-wide text-text-primary mb-2">
              Stay Inspired
            </h3>
            <p className="font-body-sm text-body-sm text-text-secondary mb-3">
              Get thoughtful reads, new arrivals, and special offers - straight to your inbox.
            </p>
            <BlogSubscribeForm dark={false} />
          </div>
        </aside>
      </div>
    </div>
  );
}
