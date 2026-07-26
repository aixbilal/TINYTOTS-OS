import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { data: page } = await supabaseAdmin
    .from("site_pages")
    .select("title, content")
    .eq("slug", "shipping-returns")
    .single();

  return (
    <div className="w-full max-w-full overflow-x-hidden py-8 px-4 sm:px-6">
      <article className="w-full max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight leading-tight mb-6">
          {page?.title || "shipping-returns"}
        </h1>
        <div
          className="w-full text-on-surface text-base leading-relaxed space-y-4
            break-words [&_*]:max-w-full [&_*]:box-border
            [&_p]:mb-4 [&_p]:leading-relaxed
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-2
            [&_strong]:font-semibold [&_strong]:text-on-surface
            [&_a]:text-primary [&_a]:underline [&_a]:break-all"
          dangerouslySetInnerHTML={{ __html: page?.content || "<p>Content coming soon.</p>" }}
        />
      </article>
    </div>
  );
}
