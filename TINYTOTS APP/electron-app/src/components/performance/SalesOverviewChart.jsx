import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const glassCard =
  "rounded-2xl border border-white/40 backdrop-blur-xl transition-transform duration-300";
const glassCardStyle = {
  background: "linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
};

function formatK(v) {
  if (v >= 1000) return `Rs. ${Math.round(v / 1000)}K`;
  return `Rs. ${v}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 shadow-sm text-xs border border-white/40 backdrop-blur-xl" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.35) 100%)" }}>
      <p className="text-ink-900 font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
        {p.name}: Rs. {Number(p.value).toLocaleString("en-PK")}
      </p>
      ))}
    </div>
  );
}

export default function SalesOverviewChart({ data }) {
  return (
    <div className={`p-6 hover:scale-[1.01] ${glassCard}`} style={glassCardStyle}>
    <div className="flex items-center justify-between mb-5">
      <h3 className="font-display text-xl text-ink-900">Sales Overview</h3>
        <select className="border border-white/40 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm text-ink-700">
          <option>Daily</option>
          <option>Weekly</option>
        </select>
      </div>
      <div className="flex items-center gap-5 mb-3 text-xs text-ink-700">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-maroon-700 inline-block rounded" /> Sales
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-gold-500 inline-block rounded border-t border-dashed" /> Goal
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7a1f2b" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#7a1f2b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e8ddd0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8a7a68" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatK} tick={{ fontSize: 11, fill: "#8a7a68" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="goal"
            name="Goal"
            stroke="#c9a24b"
            strokeDasharray="6 4"
            fill="none"
            strokeWidth={2}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="sales"
            name="Sales"
            stroke="#7a1f2b"
            strokeWidth={2.5}
            fill="url(#salesFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}