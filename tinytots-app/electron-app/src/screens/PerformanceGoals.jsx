import { useEffect, useState, useCallback } from "react";
import {
  Banknote,
  ShoppingBag,
  ShoppingCart,
  Package,
  TrendingUp as TrendingIcon,
  Plus,
  ArrowUpRight,
  Star,
  Target,
} from "lucide-react";
import KpiCard from "../components/performance/KpiCard";
import SalesOverviewChart from "../components/performance/SalesOverviewChart";
import GoalSummaryCard from "../components/performance/GoalSummaryCard";
import SetGoalForm from "../components/performance/SetGoalForm";
import CategoryDonut from "../components/performance/CategoryDonut";
import DailyHeatmap from "../components/performance/DailyHeatmap";
import InsightCard from "../components/performance/InsightCard";
import Button from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import { PageHeader, KpiGroup } from "../components/ui/Layout";
import { LoadingState, ErrorState } from "../components/ui/States";

const RANGE_OPTIONS = [
  { value: "month", label: "This Month" },
  { value: "3month", label: "Last 3 Months" },
  { value: "6month", label: "Last 6 Months" },
  { value: "12month", label: "Last 12 Months" },
  { value: "all", label: "Since Launch" },
];

const pkr = (v) => `Rs. ${Math.round(v || 0).toLocaleString("en-PK")}`;

export default function PerformanceGoals() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState("month");

  const loadSummary = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch(`http://localhost:3000/api/performance/summary?range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSummary(data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const kpis = summary?.kpis;
  const deltas = kpis?.deltas || {};
  const rangeLabel = RANGE_OPTIONS.find((r) => r.value === range)?.label;

  return (
    <div className="mx-auto max-w-[1600px] flex flex-col gap-6">
      <PageHeader
        title={<>Performance <span className="text-brand">&amp;</span> Goals</>}
        description="Track performance, analyse trends and hit your targets."
      >
        <Select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="!py-2 h-9"
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Button
          onClick={() =>
            document.getElementById("set-goal-form")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <Plus size={15} /> Set New Goal
        </Button>
      </PageHeader>

      {error ? (
        <div className="rounded-lg border border-border-default bg-surface-panel">
          <ErrorState onRetry={loadSummary} />
        </div>
      ) : loading && !summary ? (
        <div className="rounded-lg border border-border-default bg-surface-panel">
          <LoadingState label="Loading performance data…" />
        </div>
      ) : (
        <>
          {/* KPI row — one hairline-split surface */}
          <KpiGroup className="grid-cols-2 md:grid-cols-3 xl:grid-cols-5 divide-y md:divide-y-0">
            <KpiCard icon={Banknote} label="Total Sales" value={pkr(kpis?.totalSales)} delta={deltas.totalSales} deltaLabel="vs previous period" />
            <KpiCard icon={ShoppingBag} label="Orders" value={kpis?.orders ?? 0} delta={deltas.orders} deltaLabel="vs previous period" />
            <KpiCard icon={ShoppingCart} label="Avg Order Value" value={pkr(kpis?.aov)} delta={deltas.aov} deltaLabel="vs previous period" />
            <KpiCard icon={Package} label="Units Sold" value={kpis?.unitsSold ?? 0} delta={deltas.unitsSold} deltaLabel="vs previous period" />
            <KpiCard icon={TrendingIcon} label="Gross Profit" value={pkr(kpis?.grossProfit)} delta={deltas.grossProfit} deltaLabel="vs previous period" />
          </KpiGroup>

          {/* Sales trend + goal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <SalesOverviewChart
                data={summary?.dailySeries || []}
                title={`Sales Trend · ${rangeLabel}`}
              />
            </div>
            <GoalSummaryCard goal={summary?.goal} />
          </div>

          {/* Set goal + category + heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div id="set-goal-form">
              <SetGoalForm onGoalSet={loadSummary} />
            </div>
            <CategoryDonut data={summary?.categoryBreakdown} title="Sales by Category" />
            <DailyHeatmap heatmap={summary?.heatmap} />
          </div>

          {/* Insights */}
          <div>
            <h3 className="type-section text-text-primary mb-3">Recent Performance Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InsightCard
                icon={ArrowUpRight}
                iconBg="bg-brand-soft text-brand"
                title={(deltas.totalSales ?? 0) >= 0 ? "Sales are up" : "Sales are down"}
                description={`Total sales are ${Math.abs(deltas.totalSales ?? 0).toFixed(1)}% ${
                  (deltas.totalSales ?? 0) >= 0 ? "higher" : "lower"
                } than the previous period.`}
              />
              <InsightCard
                icon={Star}
                iconBg="bg-warning/10 text-warning-text"
                title="Top category"
                description={
                  summary?.categoryBreakdown?.length
                    ? `${summary.categoryBreakdown[0].name} leads with ${summary.categoryBreakdown[0].value}% of sales.`
                    : "No category data for this period yet."
                }
              />
              <InsightCard
                icon={Target}
                iconBg="bg-success/10 text-success-text"
                title="Goal progress"
                description={
                  summary?.goal
                    ? `You're ${summary.goal.percent}% toward your goal — ${pkr(
                        summary.goal.remaining
                      )} to go.`
                    : "No active goal — set one to start tracking."
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
