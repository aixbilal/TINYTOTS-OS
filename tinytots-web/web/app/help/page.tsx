import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const { data: articles } = await supabaseAdmin
    .from("help_articles")
    .select("id, title, slug, category")
    .eq("is_published", true)
    .order("category", { ascending: true })
    .order("display_order", { ascending: true });

  const grouped = (articles || []).reduce<Record<string, typeof articles>>((acc, a) => {
    (acc[a.category] = acc[a.category] || []).push(a);
    return acc;
  }, {});

  return (
    <div className="w-full min-h-screen py-10 px-4 sm:px-6 max-w-3xl mx-auto">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-5xl font-bold text-on-surface tracking-tight mb-3">
          Help Center
        </h1>
        <p className="text-on-surface-variant text-base sm:text-lg">
          Answers to common questions about orders, delivery, and returns.
        </p>
      </div>

      {Object.entries(grouped).length === 0 && (
        <p className="text-on-surface-variant">No help articles published yet.</p>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-8">
          <h2 className="text-lg font-bold text-on-surface capitalize mb-3">{category}</h2>
          <div className="flex flex-col gap-2">
            {items!.map((a) => (
              <Link
                key={a.id}
                href={`/help/${a.slug}`}
                className="group flex items-center justify-between rounded-2xl bg-surface border border-outline-variant/30 hover:border-primary/40 hover:shadow-sm transition-all px-5 py-4"
              >
                <span className="font-medium text-on-surface group-hover:text-primary transition-colors">
                  {a.title}
                </span>
                <span className="text-primary text-sm">→</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}