import { PieChart, Pie, Cell } from "recharts";
import { EmptyState } from "../ui/States";

// Warm categorical ramp: tonal olive → terracotta → warm-neutral, from the
// approved TinyTots palette (DESIGN.md §14). Inline SVG fills. `theme` prop
// kept for API compatibility but is a no-op.
const COLORS = ["#616845", "#8f5030", "#a89a82", "#c9bca3", "#8c6b4f"];

/**
 * Category share donut. `data` is the real breakdown
 * ([{ name, value }] as percentages) from /api/performance/summary.
 * `bare` drops the panel chrome for callers with their own <Section>.
 */
export default function CategoryDonut({ data, title = "Top Selling Categories", bare = false }) {
  const hasData = Array.isArray(data) && data.length > 0;

  const body = !hasData ? (
    <EmptyState
      title="No category data yet"
      description="Category performance appears once sales are recorded."
      className="py-8"
    />
  ) : (
    <div className="flex items-center gap-5">
      <PieChart width={140} height={140}>
        <Pie
          data={data}
          dataKey="value"
          innerRadius={42}
          outerRadius={66}
          stroke="none"
          isAnimationActive={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
      <div className="flex-1 space-y-2">
        {data.map((c, i) => (
          <div key={c.name} className="flex items-center justify-between type-body-sm">
            <span className="flex items-center gap-2 text-text-primary">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              {c.name}
            </span>
            <span className="text-text-secondary">{c.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (bare) return body;

  return (
    <div className="rounded-lg border border-border-default bg-surface-panel p-5 h-full">
      <h3 className="type-section text-text-primary mb-4">{title}</h3>
      {body}
    </div>
  );
}
