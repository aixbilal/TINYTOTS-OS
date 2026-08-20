import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabaseAnon } from "@/lib/supabase-anon";
import BlogSubscribeForm from "@/components/BlogSubscribeForm";
import InternalTrustStrip from "@/components/InternalTrustStrip";

// Static-generate, ISR-revalidate every 60s — same pattern already used
// site-wide for content pages.
export const revalidate = 60;

const BLOG_CATEGORIES = [
  "Parenting Tips",
  "Sizing & Fit",
  "Policies, Explained Simply",
  "Behind the Scenes",
  "Brand Story",
];

const HERO_DEFAULTS = {
  hero_image_url: "",
  hero_image_url_mobile: "",
  hero_eyebrow: "The Journal",
  hero_headline: "Stories, style guides, and care tips.",
  hero_subtext: "For your little ones, from our family to yours.",
  subscribe_image_url: "",
  subscribe_headline: "Never miss a story.",
  subscribe_subtext: "Get new articles, style guides, and care tips delivered to your inbox.",
};

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

function formatBlogDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const { data: heroData, error: heroError } = await supabaseAnon.from("blog_page_content").select("*").eq("id", 1).single();
  if (heroError) console.error("[blog] Failed to fetch blog_page_content:", heroError.message);
  const hero = { ...HERO_DEFAULTS, ...(heroData || {}) };

  let query = supabaseAdmin
    .from("blog_posts")
    .select("id, title, slug, author, content, featured_image_url, category, published_at, is_published, is_featured, is_popular")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data: posts, error: postsError } = await query;
  if (postsError) {
    // Was silently swallowed before (data destructured, error ignored) -
    // that's exactly why a missing column (e.g. is_featured/is_popular not
    // yet migrated) would fail the whole query and just render as an empty
    // "no posts" page instead of a visible, diagnosable error. Logging
    // server-side now so this failure mode is never silent again.
    console.error("[blog] Failed to fetch blog_posts:", postsError.message);
  }
  const allPosts = posts || [];

  const featured = allPosts.find((p) => p.is_featured) || allPosts[0];
  const restPosts = allPosts.filter((p) => p.id !== featured?.id);
  const popularPosts = allPosts.filter((p) => p.is_popular).slice(0, 5);

  return (
    <>
      {/* Hero — full-bleed, same proven pattern as homepage/Our Story */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 aspect-[4/5] sm:aspect-[16/9] mb-stack-lg overflow-hidden bg-surface-canvas">
        {hero.hero_image_url_mobile ? (
          <Image src={hero.hero_image_url_mobile} alt="" fill sizes="100vw" priority className="object-cover sm:hidden" />
        ) : (
          <div className="absolute inset-0 sm:hidden bg-surface-secondary" />
        )}
        {hero.hero_image_url ? (
          <Image
            src={hero.hero_image_url}
            alt=""
            fill
            sizes="100vw"
            priority
            className={`object-cover ${hero.hero_image_url_mobile ? "hidden sm:block" : ""}`}
          />
        ) : (
          <div className={`absolute inset-0 bg-surface-secondary ${hero.hero_image_url_mobile ? "hidden sm:block" : ""}`} />
        )}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(250,247,242,0.92) 0%, rgba(250,247,242,0.55) 38%, rgba(250,247,242,0) 62%)",
          }}
        />
        <div className="absolute inset-0 z-[2] flex flex-col justify-center px-6 sm:px-10 md:px-16">
          <div className="max-w-md">
            <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-3 block">
              {hero.hero_eyebrow}
            </span>
            <h1 className="font-display-xl text-[30px] sm:text-[36px] md:text-[44px] text-text-primary leading-[1.15] tracking-tight mb-4">
              {hero.hero_headline}
            </h1>
            <p className="font-body-md text-body-md text-text-secondary leading-snug">{hero.hero_subtext}</p>
          </div>
        </div>
      </section>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Featured Story */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group relative flex flex-col md:flex-row mb-stack-lg overflow-hidden bg-surface-elevated border border-border-default"
          >
            <div className="relative w-full md:w-1/2 aspect-[16/10] md:aspect-auto shrink-0 bg-surface-secondary">
              {featured.featured_image_url ? (
                <Image
                  src={featured.featured_image_url}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-secondary/40 font-label-md text-label-md uppercase tracking-widest">
                  TinyTots
                </div>
              )}
            </div>
            <div className="p-6 md:p-10 flex flex-col justify-center flex-1">
              <span className="font-label-md text-label-md uppercase tracking-wider text-brand-primary mb-3">
                Featured Story
              </span>
              <h2 className="font-display-xl text-[24px] md:text-[30px] text-text-primary tracking-tight mb-3 group-hover:text-brand-primary transition-colors">
                {featured.title}
              </h2>
              <p className="font-body-md text-body-md text-text-secondary mb-4 leading-relaxed">
                {getPlainTextExcerpt(featured.content, 180)}
              </p>
              <span className="font-label-md text-label-md text-text-secondary">
                By {featured.author || "TinyTots Editorial"}
                {featured.published_at ? ` · ${formatBlogDate(featured.published_at)}` : ""}
              </span>
            </div>
          </Link>
        )}

        {/* Main column (articles) + sidebar (popular posts + tags) */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-stack-md items-start mb-stack-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {restPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col border border-border-default hover:border-brand-primary/40 transition-colors overflow-hidden"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-surface-secondary flex items-center justify-center shrink-0">
                  {post.featured_image_url ? (
                    <Image
                      src={post.featured_image_url}
                      alt=""
                      width={400}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-text-secondary/40 uppercase tracking-widest">
                      TinyTots
                    </span>
                  )}
                </div>
                <div className="flex flex-col justify-between flex-1 p-4">
                  <div>
                    {post.category && (
                      <span className="font-label-md text-label-md uppercase tracking-wider text-brand-primary">
                        {post.category}
                      </span>
                    )}
                    <h2 className="font-headline-md text-headline-md text-text-primary group-hover:text-brand-primary transition-colors mt-1 mb-2">
                      {post.title}
                    </h2>
                    <p className="font-body-sm text-body-sm text-text-secondary line-clamp-2">
                      {getPlainTextExcerpt(post.content)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between font-label-md text-label-md text-text-secondary mt-3 pt-2.5 border-t border-border-default">
                    <span>{post.published_at ? formatBlogDate(post.published_at) : ""}</span>
                    <span className="text-brand-primary group-hover:underline">Read Article →</span>
                  </div>
                </div>
              </Link>
            ))}
            {restPosts.length === 0 && !featured && (
              <p className="font-body-md text-body-md text-text-secondary py-8 sm:col-span-2">No posts published yet.</p>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {popularPosts.length > 0 && (
              <div>
                <h3 className="font-label-lg text-label-lg uppercase tracking-wide text-text-primary mb-3">
                  Popular Posts
                </h3>
                <div className="flex flex-col gap-3">
                  {popularPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="font-body-sm text-body-sm text-text-secondary hover:text-brand-primary transition-colors block"
                    >
                      {post.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-label-lg text-label-lg uppercase tracking-wide text-text-primary mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {BLOG_CATEGORIES.map((c) => (
                  <Link
                    key={c}
                    href={category === c ? "/blog" : `/blog?category=${encodeURIComponent(c)}`}
                    className={`font-label-md text-label-md px-3 py-1.5 rounded-full border transition-colors ${
                      category === c
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "border-border-default text-text-secondary hover:border-brand-primary"
                    }`}
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email subscribe - compact horizontal banner, contained (not
          full-bleed/oversized like the previous dark full-width version) */}
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mb-stack-lg">
        <div className="relative flex flex-col sm:flex-row items-center gap-5 overflow-hidden rounded-xl border border-brand-primary/15 bg-brand-primary/[0.05] p-5 sm:p-6">
          <div className="relative w-full sm:w-32 aspect-[4/3] sm:aspect-square shrink-0 overflow-hidden rounded-lg bg-surface-secondary">
            {hero.subscribe_image_url ? (
              <Image src={hero.subscribe_image_url} alt="" fill sizes="128px" className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-text-secondary/40">
                <span className="material-symbols-outlined text-[28px]">mail</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display-xl text-[20px] md:text-[24px] text-text-primary tracking-tight mb-1">
              {hero.subscribe_headline}
            </h2>
            <p className="font-body-sm text-body-sm text-text-secondary mb-3">{hero.subscribe_subtext}</p>
            <BlogSubscribeForm dark={false} />
          </div>
        </div>
      </div>
      <InternalTrustStrip />
    </>
  );
}
