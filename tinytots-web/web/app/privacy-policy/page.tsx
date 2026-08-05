import { supabaseAdmin } from "@/lib/supabase-admin";
import LegalPageLayout from "@/components/LegalPageLayout";
import { extractTocAndAnnotate } from "@/lib/site-page-toc";
import { sanitizeContentHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export default async function PrivacyPolicyPage() {
  const { data: page } = await supabaseAdmin
    .from("site_pages")
    .select("title, content, updated_at")
    .eq("slug", "privacy-policy")
    .single();

  const { html, sections } = extractTocAndAnnotate(
    page?.content || "<p>Content coming soon.</p>"
  );

  const safeHtml = sanitizeContentHtml(html);

  return (
    <LegalPageLayout
      title={page?.title || "Privacy Policy"}
      lastUpdated={
        page?.updated_at ? new Date(page.updated_at).toLocaleDateString() : ""
      }
      sections={sections}
    >
      <div
        className="w-full break-words text-on-surface-variant font-body-md text-body-md
          [&_h2]:font-headline-lg [&_h2]:text-on-surface [&_h2]:mb-3 [&_h2]:mt-2
          [&_p]:mb-4 [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-2
          [&_strong]:font-semibold [&_strong]:text-on-surface
          [&_a]:text-primary [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </LegalPageLayout>
  );
}