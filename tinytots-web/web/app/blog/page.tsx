import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
function getPlainTextExcerpt(htmlContent: string, maxLength: number = 130) {
  if (!htmlContent) return "";
  const withoutTags = htmlContent.replace(/<[^>]+>/g, "");
  const decoded = withoutTags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (decoded.length <= maxLength) return decoded;
  return decoded.substring(0, maxLength) + "...";
}
export default async function BlogPage() {
  const { data: posts } = await supabaseAdmin
    .from("blog_posts")
    .select("id, title, slug, author, content, featured_image_url, published_at, is_published")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  return (
    <div className="w-full min-h-screen py-10 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-5xl font-bold text-on-surface tracking-tight mb-3">
          TinyTots Journal
        </h1>
        <p className="text-on-surface-variant text-base sm:text-lg">
          Stories, style guides, and care tips for your little ones.
        </p>
      </div>

      {/* Fluffy Stacked Rectangles List */}
      <div className="flex flex-col gap-5">
        {posts?.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group flex flex-col sm:flex-row items-stretch gap-5 rounded-3xl bg-surface border border-outline-variant/30 hover:border-primary/40 hover:shadow-md transition-all p-5"
          >
            {/* Image Box */}
            <div className="h-40 sm:h-36 w-full sm:w-48 rounded-2xl overflow-hidden border border-outline-variant/20 bg-surface-container-low shrink-0 flex items-center justify-center">
              {post.featured_image_url ? (
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <span className="text-xs font-semibold text-on-surface-variant/40 uppercase tracking-widest">
                  TinyTots
                </span>
              )}
            </div>

            {/* Content & Metadata Window */}
            <div className="flex flex-col justify-between w-full min-w-0 py-0.5">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  By {post.author || "TinyTots Editorial"}
                </p>

                <h2 className="font-bold text-on-surface text-lg sm:text-xl leading-snug group-hover:text-primary transition-colors mb-2">
                  {post.title}
                </h2>

                <p className="text-xs sm:text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                  {getPlainTextExcerpt(post.content)}
                </p>
              </div>

              {/* Bottom Footer Line */}
              <div className="flex items-center justify-between text-xs font-medium text-on-surface-variant mt-3 pt-2.5 border-t border-outline-variant/15">
                <span>
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString()
                    : ""}
                </span>
                <span className="text-primary group-hover:underline font-semibold">
                  Read Article →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}