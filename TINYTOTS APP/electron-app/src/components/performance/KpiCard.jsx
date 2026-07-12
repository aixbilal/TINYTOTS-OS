import { TrendingUp, TrendingDown } from "lucide-react";

const glassCard =
  "rounded-2xl border border-white/40 backdrop-blur-xl transition-transform duration-300";
const glassCardStyle = {
  background: "linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
};

export default function KpiCard({ icon: Icon, label, value, delta }) {
  const up = delta >= 0;
  return (
    <div className={`p-5 flex-1 min-w-[190px] hover:-translate-y-0.5 ${glassCard}`} style={glassCardStyle}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-white/25 border border-white/40 flex items-center justify-center text-ink-900">
          <Icon size={18} />
        </div>
        <p className="text-sm text-ink-700">{label}</p>
      </div>
      <p className="font-display text-2xl text-ink-900 mb-1.5">{value}</p>
      <div className={`flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-600" : "text-maroon-700"}`}>
        {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {Math.abs(delta).toFixed(1)}% vs last month
      </div>
    </div>
  );
}