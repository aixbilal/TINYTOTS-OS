"use client";

interface UspItem {
  icon: string;
  title: string;
  description: string;
}

function UspCard({ item }: { item: UspItem }) {
  return (
    <div className="shrink-0 w-[220px] flex flex-col items-center text-center gap-2 p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 mx-2">
      <span className="material-symbols-outlined text-primary text-[32px]">{item.icon || "star"}</span>
      <h3 className="font-headline-md text-headline-md text-on-surface">{item.title}</h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant">{item.description}</p>
    </div>
  );
}

// A continuously-scrolling strip of USP cards (pauses on hover), instead of
// a static grid — same seamless double-copy technique as the announcement
// bar ticker, just with cards instead of text.
export default function UspMarquee({ items }: { items: UspItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden py-2 group">
      <div className="flex w-max group-hover:[animation-play-state:paused]" style={{ animation: "marquee-loop 25s linear infinite" }}>
        <div className="flex shrink-0">
          {items.map((item, i) => (
            <UspCard key={`a-${i}`} item={item} />
          ))}
        </div>
        <div className="flex shrink-0" aria-hidden="true">
          {items.map((item, i) => (
            <UspCard key={`b-${i}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
