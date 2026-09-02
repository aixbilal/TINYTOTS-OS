import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";
import LegalPageLayout from "@/components/LegalPageLayout";
import LegalAccordionSections from "@/components/LegalAccordionSections";
import LegalContactCta from "@/components/LegalContactCta";
import { extractTocAndAnnotate, splitIntoSections } from "@/lib/site-page-toc";
import { sanitizeContentHtml } from "@/lib/sanitize";

export const metadata: Metadata = { title: "Privacy Policy" };

// Static-generate — legal content, edited rarely via admin CMS.
export const revalidate = 3600;

export default async function PrivacyPolicyPage() {
  const { data: page } = await supabaseAdmin
    .from("site_pages")
    .select("title, content, updated_at")
    .eq("slug", "privacy-policy")
    .single();

  const { html, sections: tocSections } = extractTocAndAnnotate(
    page?.content || "<p>Content coming soon.</p>"
  );

  const safeHtml = sanitizeContentHtml(html);
  const sections = splitIntoSections(safeHtml);

  return (
    <LegalPageLayout
      title={page?.title || "Privacy Policy"}
      lastUpdated={
        page?.updated_at ? new Date(page.updated_at).toLocaleDateString() : ""
      }
      sections={tocSections}
      heroIcon="shield"
    >
      {sections.length > 0 ? (
        <LegalAccordionSections sections={sections} />
      ) : (
        <div
          className="w-full break-words text-text-secondary font-body-md text-body-md [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      )}
      <LegalContactCta pageLabel="Privacy Policy" />
    </LegalPageLayout>
  );
}
