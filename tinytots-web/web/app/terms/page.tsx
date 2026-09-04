import { supabaseAdmin } from "@/lib/supabase-admin";
import LegalPageLayout from "@/components/LegalPageLayout";
import LegalAccordionSections from "@/components/LegalAccordionSections";
import LegalContactCta from "@/components/LegalContactCta";
import { extractTocAndAnnotate, splitIntoSections } from "@/lib/site-page-toc";
import { sanitizeContentHtml } from "@/lib/sanitize";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms & Conditions",
  description:
    "TinyTots Terms & Conditions — the terms that apply when you browse tinytotsofficial.com and place an order with us in Pakistan.",
  path: "/terms",
});

// Static-generate — legal content, edited rarely via admin CMS.
export const revalidate = 3600;

export default async function TermsPage() {
  const { data: page } = await supabaseAdmin
    .from("site_pages")
    .select("title, content, updated_at")
    .eq("slug", "terms")
    .single();

  const { html, sections: tocSections } = extractTocAndAnnotate(
    page?.content || "<p>Content coming soon.</p>"
  );
  // Sanitize after TOC annotation so heading `id` attrs for scroll-spy survive.
  const safeHtml = sanitizeContentHtml(html);
  const sections = splitIntoSections(safeHtml);

  return (
    <LegalPageLayout
      title={page?.title || "Terms & Conditions"}
      lastUpdated={
        page?.updated_at ? new Date(page.updated_at).toLocaleDateString() : ""
      }
      sections={tocSections}
      heroIcon="gavel"
    >
      {sections.length > 0 ? (
        <LegalAccordionSections sections={sections} />
      ) : (
        <div
          className="w-full break-words text-text-secondary font-body-md text-body-md [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      )}
      <section
        aria-labelledby="product-imagery-note"
        className="mt-stack-lg border-t border-border-subtle pt-stack-md"
      >
        <h2
          id="product-imagery-note"
          className="font-headline-md text-headline-md text-text-primary mb-stack-sm"
        >
          Product Imagery
        </h2>
        <div className="w-full break-words text-text-secondary font-body-md text-body-md [&_p]:mb-4">
          <p>
            Product visuals on this website may be AI-generated or digitally enhanced for
            presentation. We use these images to show style, fit and styling context
            consistently across the catalogue.
          </p>
          <p>
            Actual products may differ from the images shown — including in colour, fabric
            texture, print or embroidery placement, trims, packaging and other minor details.
            Screen and device settings can also affect how colours appear. If a delivered item
            differs materially from its description, our easy 7-day returns apply (see{" "}
            <a href="/shipping-returns" className="text-brand-primary hover:underline">
              Shipping &amp; Returns
            </a>
            ).
          </p>
        </div>
      </section>
      <LegalContactCta pageLabel="Terms & Conditions" />
    </LegalPageLayout>
  );
}
