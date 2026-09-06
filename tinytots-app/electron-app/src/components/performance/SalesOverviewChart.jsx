import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatK(v) {
  if (Math.abs(v) >= 1000) return `Rs. ${Math.round(v / 1000)}K`;
  return `Rs. ${v}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border-strong bg-surface-elevated px-3 py-2 text-xs shadow-lg">
      <p className="text-text-primary font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: Rs. {Number(p.value).toLocaleString("en-PK")}
        </p>
      ))}
    </div>
  );
}

/**
 * Sales-over-time area chart. `data` is the real daily series
 * ([{ date, sales, goal }]) from /api/performance/summary — the caller owns
 * data fetching and the empty state.
 */
export default function SalesOverviewChart({ data = [], title = "Sales Overview", control }) {
  return (
    <div className="rounded-xl border border-border-default bg-surface-panel p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="type-section text-text-primary">{title}</h3>
        {control}
      </div>
      <div className="flex items-center gap-4 mb-2 type-caption text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-0.5 bg-brand inline-block rounded" /> Sales
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-0 border-t-2 border-dashed border-gold-600 inline-block" /> Goal
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0483e" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#f0483e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#26262b" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#8a8a93" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatK}
            tick={{ fontSize: 11, fill: "#8a8a93" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3a3a42" }} />
          <Area
            type="monotone"
            dataKey="goal"
            name="Goal"
            stroke="#8a8a93"
            strokeDasharray="6 4"
            fill="none"
            strokeWidth={1.75}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="sales"
            name="Sales"
            stroke="#f0483e"
            strokeWidth={2.25}
            fill="url(#salesFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
