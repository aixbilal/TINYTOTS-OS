import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";
import HelpCenterIndex, { type HelpPageContent } from "@/components/HelpCenterIndex";
import { normalizeHelpCategory } from "@/lib/help-categories";

export const metadata: Metadata = { title: "Help Center" };

// Static-generate — policy content, edited rarely via admin CMS.
export const revalidate = 3600;

const DEFAULT_CONTENT: HelpPageContent = {
  hero_image_url: "",
  hero_image_url_mobile: "",
  hero_eyebrow: "Help Center",
  hero_headline: "How can we help you?",
  hero_subtext: "Find answers to common questions or get in touch with our team.",
  support_image_url: "",
};

export default async function HelpPage() {
  const [{ data: articles }, { data: contentRow }] = await Promise.all([
    supabaseAdmin
      .from("help_articles")
      .select("id, title, slug, category, display_order")
      .eq("is_published", true)
      .order("display_order", { ascending: true }),
    supabaseAdmin.from("help_page_content").select("*").eq("id", 1).single(),
  ]);

  const normalized = (articles || []).map((a) => ({
    id: a.id as number,
    title: a.title as string,
    slug: a.slug as string,
    category: normalizeHelpCategory(a.category),
  }));

  const content: HelpPageContent = { ...DEFAULT_CONTENT, ...(contentRow || {}) };

  return <HelpCenterIndex articles={normalized} content={content} />;
}
