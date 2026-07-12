import { PieChart, Pie, Cell } from "recharts";

const COLORS = ["#7a1f2b", "#c9a24b", "#1c1c1c", "#8a6a4a", "#e8ddd0"];

const glassCard =
  "rounded-2xl border border-white/40 backdrop-blur-xl transition-transform duration-300";
const glassCardStyle = {
  background: "linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
};

export default function CategoryDonut({ data }) {
  const chartData = data?.length ? data : [{ name: "No data", value: 100 }];

  return (
    <div className={`p-6 hover:scale-[1.01] ${glassCard}`} style={glassCardStyle}>
      <h3 className="font-display text-xl text-ink-900 mb-5">Sales by Category</h3>
      <div className="flex items-center gap-6">
        <PieChart width={150} height={150}>
          <Pie data={chartData} dataKey="value" innerRadius={45} outerRadius={70} stroke="none">
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
        <div className="flex-1 space-y-2.5">
          {chartData.map((c, i) => (
            <div key={c.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink-900">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {c.name}
              </span>
              <span className="text-ink-700">{c.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}