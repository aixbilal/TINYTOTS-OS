import { iconForSectionTitle } from "@/lib/site-page-toc";

const bodyClass =
  "text-text-secondary font-body-md text-body-md " +
  "[&_p]:mb-4 [&_p:last-child]:mb-0 [&_p]:leading-relaxed " +
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2 " +
  "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-2 " +
  "[&_strong]:font-semibold [&_strong]:text-text-primary " +
  "[&_a]:text-brand-primary [&_a]:underline";

export default function LegalAccordionSections({
  sections,
}: {
  sections: { id: string; title: string; bodyHtml: string }[];
}) {
  return (
    <div className="flex flex-col divide-y divide-border-default border border-border-default rounded-xl bg-surface-elevated overflow-hidden">
      {sections.map((s, i) => {
        // Admin-authored headings are often already manually numbered
        // ("1. About Tiny Tots") - strip that so it isn't duplicated next
        // to the auto-generated "01." badge below.
        const displayTitle = s.title.replace(/^\d+[.)]\s*/, "");
        return (
        <details key={s.id} id={s.id} open className="group scroll-mt-28">
          <summary className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">{iconForSectionTitle(s.title)}</span>
            </span>
            <span className="flex-1 min-w-0 flex items-baseline gap-2">
              <span className="font-label-md text-label-md text-brand-primary tabular-nums">
                {String(i + 1).padStart(2, "0")}.
              </span>
              <span className="font-headline-md text-headline-md text-text-primary">{displayTitle}</span>
            </span>
            <span className="material-symbols-outlined text-text-secondary text-[22px] shrink-0 transition-transform duration-200 group-open:rotate-180">
              expand_more
            </span>
          </summary>
          <div
            className={`px-5 pb-5 pl-[4.75rem] ${bodyClass}`}
            dangerouslySetInnerHTML={{ __html: s.bodyHtml }}
          />
        </details>
        );
      })}
    </div>
  );
}
