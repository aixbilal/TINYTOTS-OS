import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import {
  Banknote, // Replaced IndianRupee with Banknote as Lucide doesn't have a specific PKR icon
  ShoppingBag,
  ShoppingCart,
  Package,
  TrendingUp as TrendingIcon,
  Plus,
  ArrowUpRight,
  Star,
  Target,
} from "lucide-react";
import FloralFlourish from "../components/FloralFlourish";
import KpiCard from "../components/performance/KpiCard";
import SalesOverviewChart from "../components/performance/SalesOverviewChart";
import GoalSummaryCard from "../components/performance/GoalSummaryCard";
import SetGoalForm from "../components/performance/SetGoalForm";
import CategoryDonut from "../components/performance/CategoryDonut";
import DailyHeatmap from "../components/performance/DailyHeatmap";
import InsightCard from "../components/performance/InsightCard";
import loginBg from "../assets/login-bg.png";

const RANGE_OPTIONS = [
  { value: "month", label: "This Month" },
  { value: "3month", label: "Last 3 Months" },
  { value: "6month", label: "Last 6 Months" },
  { value: "12month", label: "Last 12 Months" },
  { value: "all", label: "Since Launch" },
];

export default function PerformanceGoals() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");
  const [rangeOpen, setRangeOpen] = useState(false);

  const navigate = useNavigate();

  const loadSummary = useCallback(() => {
    setLoading(true);
    fetch(`http://localhost:3000/api/performance/summary?range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSummary(data);
      })
      .catch((err) => console.error("performance summary fetch failed:", err))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);
  const kpis = summary?.kpis;
  const pkr = (v) => `Rs. ${Math.round(v || 0).toLocaleString("en-PK")}`;

  return (
    <div
      className="min-h-screen px-8 py-7 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Back to Dashboard */}
      <button
        onClick={() => navigate("/dashboard")}
        className="inline-flex items-center gap-2 text-sm text-ink-700 hover:text-maroon-700 mb-4"
      >
        <ArrowLeft size={15} /> Dashboard
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-7 relative">
        <div>
          <h1 className="font-display text-4xl text-ink-900">
            Performance <span className="text-maroon-700">x</span> Goals
          </h1>
          <p className="text-ink-700 mt-1.5">Track performance, analyze trends and achieve your targets.</p>
        </div>
        <div className="flex items-center gap-3">
        <div className="relative">
            <button
              onClick={() => setRangeOpen((o) => !o)}
              className="flex items-center gap-2 border border-white/40 rounded-lg px-4 py-2.5 text-sm text-ink-900 bg-white/25 backdrop-blur-sm hover:bg-white/35 transition-colors"
            >
              {RANGE_OPTIONS.find((r) => r.value === range)?.label}
            </button>
            {rangeOpen && (
              <div
                className="absolute z-10 mt-1 w-48 overflow-hidden right-0 rounded-lg border border-white/40 backdrop-blur-xl"
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)",
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
                }}
              >
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setRange(opt.value);
                      setRangeOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/30 transition-colors ${
                      opt.value === range ? "text-maroon-700 font-medium" : "text-ink-900"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => document.getElementById("set-goal-form")?.scrollIntoView({ behavior: "smooth" })}
            className="flex items-center gap-2 bg-maroon-700 text-cream-50 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-maroon-800"
          >
            <Plus size={16} /> Set New Goal
          </button>
        </div>
        <div className="absolute -top-4 right-40 opacity-40 pointer-events-none hidden lg:block">
          <FloralFlourish />
        </div>
      </div>

      {/* KPI row */}
      <div className="flex flex-wrap gap-4 mb-6">
        <KpiCard icon={Banknote} label="Total Sales" value={pkr(kpis?.totalSales)} delta={kpis?.deltas.totalSales ?? 0} />
        <KpiCard icon={ShoppingBag} label="Orders" value={kpis?.orders ?? 0} delta={kpis?.deltas.orders ?? 0} />
        <KpiCard icon={ShoppingCart} label="Average Order Value" value={pkr(kpis?.aov)} delta={kpis?.deltas.aov ?? 0} />
        <KpiCard icon={Package} label="Units Sold" value={kpis?.unitsSold ?? 0} delta={kpis?.deltas.unitsSold ?? 0} />
        <KpiCard icon={TrendingIcon} label="Gross Profit" value={pkr(kpis?.grossProfit)} delta={kpis?.deltas.grossProfit ?? 0} />
      </div>

      {/* Sales overview + Goal summary */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="col-span-2">
          <SalesOverviewChart data={summary?.dailySeries || []} />
        </div>
        <GoalSummaryCard goal={summary?.goal} />
      </div>

      {/* Set goal + category + heatmap */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div id="set-goal-form">
        <SetGoalForm onGoalSet={loadSummary} />
        </div>
        <CategoryDonut data={summary?.categoryBreakdown} />
        <DailyHeatmap heatmap={summary?.heatmap} />
      </div>

      {/* Insights */}
      <div>
        <h3 className="font-display text-xl text-ink-900 mb-4">Recent Performance Insights</h3>
        <div className="flex flex-wrap gap-4">
          <InsightCard
            icon={ArrowUpRight}
            iconBg="bg-maroon-700 text-cream-50"
            title="Sales are up!"
            description={`You've achieved ${(kpis?.deltas.totalSales ?? 0).toFixed(1)}% more sales compared to last month. Keep it up!`}
          />
          <InsightCard
            icon={Star}
            iconBg="bg-gold-300/40 text-ink-900"
            title="Weekend Boost"
            description="Weekends contribute a larger share of your total sales. Plan your inventory accordingly."
          />
          <InsightCard
            icon={Target}
            iconBg="bg-ink-900 text-cream-50"
            title="Goal on Track"
            description={`You are ${summary?.goal?.percent ?? 0}% towards your monthly goal. Maintain the momentum.`}
          />
        </div>
      </div>

      {loading && <p className="text-center text-ink-700 text-sm mt-6">Loading performance data…</p>}
    </div>
  );
}