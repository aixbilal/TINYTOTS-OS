import { PieChart, Pie, Cell } from "recharts";

/**
 * Monthly goal ring + figures. `goal` is the real object from
 * /api/performance/summary ({ percent, target, achieved, remaining }).
 * `onViewDetails` is optional.
 */
export default function GoalSummaryCard({ goal, onViewDetails }) {
  const percent = goal ? Math.min(goal.percent, 100) : 0;
  const ringData = [
    { name: "done", value: percent },
    { name: "left", value: Math.max(100 - percent, 0) },
  ];
  const pkr = (v) => `Rs. ${Number(v || 0).toLocaleString("en-PK")}`;

  return (
    <div className="rounded-xl border border-border-default bg-surface-panel p-5 flex flex-col h-full">
      <h3 className="type-section text-text-primary mb-4">Goal Summary</h3>

      <div className="flex items-center gap-5 mb-4">
        <div className="relative w-[120px] h-[120px] flex-shrink-0">
          <PieChart width={120} height={120}>
            <Pie
              data={ringData}
              dataKey="value"
              innerRadius={44}
              outerRadius={58}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill="#f0483e" />
              <Cell fill="#26262b" />
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="type-heading-sm text-text-primary">
              {goal ? `${goal.percent}%` : "—"}
            </p>
            <p className="type-caption text-text-muted text-center leading-tight">
              of monthly
              <br />
              goal
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          <Figure label="Monthly Sales Goal" value={pkr(goal?.target)} />
          <Figure label="Achieved" value={pkr(goal?.achieved)} />
          <Figure label="Remaining" value={pkr(goal?.remaining)} />
        </div>
      </div>

      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="type-btn mt-auto w-full flex items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface-elevated py-2 text-text-primary hover:bg-[#26262c] transition-colors"
        >
          View Goal Details
        </button>
      )}
    </div>
  );
}

function Figure({ label, value }) {
  return (
    <div>
      <p className="type-caption text-text-muted">{label}</p>
      <p className="type-body-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}
