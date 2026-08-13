"use client";

interface UspItem {
  icon: string;
  title: string;
  description: string;
}

const CARD_WIDTH_PX = 220;
const CARD_GAP_PX = 16;

function UspCard({ item }: { item: UspItem }) {
  return (
    <div
      className="shrink-0 flex flex-col items-center text-center gap-2 p-5 rounded-xl bg-surface-elevated border border-border-default"
      style={{ width: CARD_WIDTH_PX }}
    >
      <span className="material-symbols-outlined text-brand-primary text-[32px]">{item.icon || "star"}</span>
      <h3 className="font-headline-md text-headline-md text-text-primary">{item.title}</h3>
      <p className="font-body-sm text-body-sm text-text-secondary">{item.description}</p>
    </div>
  );
}

/** Repeat items until one loop unit is wide enough for a seamless -50% scroll on large screens. */
function expandLoopUnit(items: UspItem[], minWidthPx = 1400): UspItem[] {
  if (items.length === 0) return [];
  // Each card contributes width + trailing gap (pr on the unit keeps junction spacing identical).
  const unitWidth = items.length * (CARD_WIDTH_PX + CARD_GAP_PX);
  const reps = Math.max(1, Math.ceil(minWidthPx / unitWidth));
  const out: UspItem[] = [];
  for (let i = 0; i < reps; i++) out.push(...items);
  return out;
}

function LoopUnit({ items }: { items: UspItem[] }) {
  return (
    <div className="flex shrink-0" style={{ gap: CARD_GAP_PX, paddingRight: CARD_GAP_PX }}>
      {items.map((item, i) => (
        <UspCard key={i} item={item} />
      ))}
    </div>
  );
}

// Full-bleed infinite marquee. Breaks out of page horizontal padding so cards
// scroll off the real viewport edge instead of being hard-clipped mid-card
// inside the content column. Soft side fades soften the overflow edges.
export default function UspMarquee({ items }: { items: UspItem[] }) {
  if (items.length === 0) return null;

  const unit = expandLoopUnit(items);
  const durationSec = Math.max(25, Math.round(unit.length * 3.5));

  return (
    <div
      className="relative w-screen max-w-[100vw] left-1/2 -translate-x-1/2 overflow-hidden py-2 group"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 48px, black calc(100% - 48px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 48px, black calc(100% - 48px), transparent 100%)",
      }}
    >
      <div
        className="flex w-max group-hover:[animation-play-state:paused]"
        style={{ animation: `marquee-loop ${durationSec}s linear infinite` }}
      >
        <LoopUnit items={unit} />
        <div aria-hidden="true">
          <LoopUnit items={unit} />
        </div>
      </div>
    </div>
  );
}
