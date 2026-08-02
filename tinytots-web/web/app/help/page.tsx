import { supabaseAdmin } from "@/lib/supabase-admin";
import HelpCenterIndex from "@/components/HelpCenterIndex";
import { normalizeHelpCategory } from "@/lib/help-categories";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const { data: articles } = await supabaseAdmin
    .from("help_articles")
    .select("id, title, slug, category, display_order")
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  const normalized = (articles || []).map((a) => ({
    id: a.id as number,
    title: a.title as string,
    slug: a.slug as string,
    category: normalizeHelpCategory(a.category),
  }));

  return <HelpCenterIndex articles={normalized} />;
}
