import { Fragment } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Intensity ramp (inline styles, so it can't ride the CSS token cascade).
// "dark" is the original elevated-surface -> coral ramp; "warm" is a tonal
// Soft Sand -> Olive ramp built from the approved TinyTots palette.
const RAMP = {
  dark: { zero: "#1c1c20", from: [28, 28, 32], to: [240, 72, 62], bar: "linear-gradient(to right, #1c1c20, #f0483e)" },
  warm: { zero: "#e7d8c0", from: [231, 216, 192], to: [97, 104, 69], bar: "linear-gradient(to right, #e7d8c0, #616845)" },
};

function cellColor(value, max, ramp) {
  if (value === null || value === undefined) return "transparent";
  if (max === 0) return ramp.zero;
  const t = Math.min(value / max, 1);
  const rgb = ramp.from.map((c, i) => Math.round(c + (ramp.to[i] - c) * t));
  return `rgb(${rgb.join(",")})`;
}

export default function DailyHeatmap({ heatmap, theme = "dark" }) {
  const ramp = RAMP[theme] || RAMP.dark;
  const rows = heatmap?.length ? heatmap : [];
  const max = Math.max(1, ...rows.flat().filter((v) => v !== null));

  return (
    <div className="rounded-xl border border-border-default bg-surface-panel p-5">
      <h3 className="type-section text-text-primary mb-4">Daily Sales Breakdown</h3>

      <div className="grid" style={{ gridTemplateColumns: "60px repeat(7, 1fr)", rowGap: "8px", columnGap: "8px" }}>
        <div />
        {DAYS.map((d) => (
          <div key={d} className="text-center type-caption text-text-muted">{d}</div>
        ))}
        {rows.map((row, wi) => (
          <Fragment key={`week-${wi}`}>
            <div className="type-caption text-text-muted flex items-center">Week {wi + 1}</div>
            {row.map((val, di) => (
             <div
             key={`${wi}-${di}`}
             className="h-9 rounded-md hover:scale-110 hover:shadow-sm transition-transform duration-150 cursor-default"
             style={{ backgroundColor: cellColor(val, max, ramp) }}
             title={val !== null && val !== undefined ? `Rs. ${Math.round(val).toLocaleString("en-PK")}` : ""}
           />
            ))}
          </Fragment>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 type-caption text-text-muted">
        <span>Low Sales</span>
        <div className="flex-1 mx-3 h-2 rounded-full" style={{ background: ramp.bar }} />
        <span>High Sales</span>
      </div>
    </div>
  );
}