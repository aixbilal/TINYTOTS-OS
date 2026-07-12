import { PieChart, Pie, Cell } from "recharts";

const glassCard =
  "rounded-2xl border border-white/40 backdrop-blur-xl transition-transform duration-300";
const glassCardStyle = {
  background: "linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
};

export default function GoalSummaryCard({ goal }) {
  const percent = goal ? Math.min(goal.percent, 100) : 0;
  const ringData = [
    { name: "done", value: percent },
    { name: "left", value: 100 - percent },
  ];

  return (
    <div className={`p-6 flex flex-col hover:scale-[1.01] ${glassCard}`} style={glassCardStyle}>
      <h3 className="font-display text-xl text-ink-900 mb-5">Goal Summary</h3>

      <div className="flex items-center gap-6 mb-5">
        <div className="relative w-[130px] h-[130px] flex-shrink-0">
          <PieChart width={130} height={130}>
            <Pie
              data={ringData}
              dataKey="value"
              innerRadius={48}
              outerRadius={62}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill="#c9a24b" />
              <Cell fill="#f1e7d8" />
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-display text-2xl text-ink-900">{goal ? `${goal.percent}%` : "—"}</p>
            <p className="text-[11px] text-ink-700 text-center leading-tight">of monthly<br />goal</p>
          </div>
        </div>

        <div className="flex-1 space-y-3">
        <div>
            <p className="text-xs text-ink-700">Monthly Sales Goal</p>
            <p className="font-medium text-ink-900">Rs. {goal ? goal.target.toLocaleString("en-PK") : "0"}</p>
          </div>
          <div>
            <p className="text-xs text-ink-700">Achieved</p>
            <p className="font-medium text-ink-900">Rs. {goal ? goal.achieved.toLocaleString("en-PK") : "0"}</p>
          </div>
          <div>
            <p className="text-xs text-ink-700">Remaining</p>
            <p className="font-medium text-ink-900">Rs. {goal ? goal.remaining.toLocaleString("en-PK") : "0"}</p>
          </div>
        </div>
      </div>

      <button className="w-full flex items-center justify-center gap-2 border border-white/40 bg-white/20 rounded-lg py-2.5 text-sm text-ink-900 hover:bg-white/30 backdrop-blur-sm mt-auto">
        View Goal Details
      </button>
    </div>
  ); 
}