import { supabaseAdmin } from "@/lib/supabase-admin";
import LegalPageLayout from "@/components/LegalPageLayout";
import { extractTocAndAnnotate } from "@/lib/site-page-toc";
import { sanitizeContentHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export default async function PrivacyPolicyPage() {
  // #region agent log
  fetch("http://127.0.0.1:7261/ingest/10d5a026-855f-457d-b513-38d64a2ea290", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "16b950",
    },
    body: JSON.stringify({
      sessionId: "16b950",
      runId: "post-fix",
      hypothesisId: "E",
      location: "privacy-policy/page.tsx:enter",
      message: "privacy-policy render start (sanitize-html path)",
      data: { nodeEnv: process.env.NODE_ENV ?? null },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const { data: page } = await supabaseAdmin
    .from("site_pages")
    .select("title, content, updated_at")
    .eq("slug", "privacy-policy")
    .single();

  const { html, sections } = extractTocAndAnnotate(
    page?.content || "<p>Content coming soon.</p>"
  );

  let safeHtml = "";
  try {
    safeHtml = sanitizeContentHtml(html);
    // #region agent log
    fetch("http://127.0.0.1:7261/ingest/10d5a026-855f-457d-b513-38d64a2ea290", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "16b950",
      },
      body: JSON.stringify({
        sessionId: "16b950",
        runId: "post-fix",
        hypothesisId: "E",
        location: "privacy-policy/page.tsx:success",
        message: "sanitize-html succeeded",
        data: {
          sanitizePath: "sanitize-html",
          htmlLen: safeHtml.length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // #region agent log
    fetch("http://127.0.0.1:7261/ingest/10d5a026-855f-457d-b513-38d64a2ea290", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "16b950",
      },
      body: JSON.stringify({
        sessionId: "16b950",
        runId: "post-fix",
        hypothesisId: "E",
        location: "privacy-policy/page.tsx:fail",
        message: "sanitize-html failed",
        data: {
          msg: msg.slice(0, 500),
          isRequireEsm: msg.includes("ERR_REQUIRE_ESM"),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw err;
  }

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
