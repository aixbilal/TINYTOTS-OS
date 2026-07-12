const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const glassCard =
  "rounded-2xl border border-white/40 backdrop-blur-xl transition-transform duration-300";
const glassCardStyle = {
  background: "linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
};

function cellColor(value, max) {
  if (value === null || value === undefined) return "transparent";
  if (max === 0) return "#f1e7d8";
  const t = Math.min(value / max, 1);
  // interpolate cream (#f1e7d8) -> maroon (#7a1f2b)
  const from = [241, 231, 216];
  const to = [122, 31, 43];
  const rgb = from.map((c, i) => Math.round(c + (to[i] - c) * t));
  return `rgb(${rgb.join(",")})`;
}

export default function DailyHeatmap({ heatmap }) {
  const rows = heatmap?.length ? heatmap : [];
  const max = Math.max(1, ...rows.flat().filter((v) => v !== null));

  return (
    <div className={`p-6 hover:scale-[1.01] ${glassCard}`} style={glassCardStyle}>
      <h3 className="font-display text-xl text-ink-900 mb-5">Daily Sales Breakdown</h3>

      <div className="grid" style={{ gridTemplateColumns: "60px repeat(7, 1fr)", rowGap: "8px", columnGap: "8px" }}>
        <div />
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs text-ink-700">{d}</div>
        ))}
        {rows.map((row, wi) => (
          <>
            <div key={`label-${wi}`} className="text-xs text-ink-700 flex items-center">Week {wi + 1}</div>
            {row.map((val, di) => (
             <div
             key={`${wi}-${di}`}
             className="h-9 rounded-md hover:scale-110 hover:shadow-sm transition-transform duration-150 cursor-default"
             style={{ backgroundColor: cellColor(val, max) }}
             title={val !== null && val !== undefined ? `Rs. ${Math.round(val).toLocaleString("en-PK")}` : ""}
           />
            ))}
          </>
        ))}
      </div>

      <div className="flex items-center justify-between mt-5 text-xs text-ink-700">
        <span>Low Sales</span>
        <div className="flex-1 mx-3 h-2 rounded-full" style={{ background: "linear-gradient(to right, #f1e7d8, #7a1f2b)" }} />
        <span>High Sales</span>
      </div>
    </div>
  );
}