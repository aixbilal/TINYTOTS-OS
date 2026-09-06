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
    <div className="mx-auto max-w-[1600px] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="type-heading-lg text-text-primary">
            Performance <span className="text-brand">&amp;</span> Goals
          </h1>
          <p className="type-body-sm text-text-secondary mt-0.5">
            Track performance, analyse trends and hit your targets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="type-input rounded-lg border border-border-strong bg-surface-elevated px-3 py-2 text-text-primary outline-none focus:border-brand"
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button
            onClick={() =>
              document.getElementById("set-goal-form")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Plus size={15} /> Set New Goal
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <ErrorState onRetry={loadSummary} />
        </div>
      ) : loading && !summary ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <LoadingState label="Loading performance data…" />
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <KpiCard
              icon={Banknote}
              label="Total Sales"
              value={pkr(kpis?.totalSales)}
              delta={deltas.totalSales}
              deltaLabel={`vs previous period`}
            />
            <KpiCard
              icon={ShoppingBag}
              label="Orders"
              value={kpis?.orders ?? 0}
              delta={deltas.orders}
              deltaLabel="vs previous period"
            />
            <KpiCard
              icon={ShoppingCart}
              label="Avg Order Value"
              value={pkr(kpis?.aov)}
              delta={deltas.aov}
              deltaLabel="vs previous period"
            />
            <KpiCard
              icon={Package}
              label="Units Sold"
              value={kpis?.unitsSold ?? 0}
              delta={deltas.unitsSold}
              deltaLabel="vs previous period"
            />
            <KpiCard
              icon={TrendingIcon}
              label="Gross Profit"
              value={pkr(kpis?.grossProfit)}
              delta={deltas.grossProfit}
              deltaLabel="vs previous period"
            />
          </div>

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
            <div className="flex flex-wrap gap-3">
              <InsightCard
                icon={ArrowUpRight}
                iconBg="bg-brand/12 text-brand"
                title={
                  (deltas.totalSales ?? 0) >= 0 ? "Sales are up" : "Sales are down"
                }
                description={`Total sales are ${Math.abs(deltas.totalSales ?? 0).toFixed(
                  1
                )}% ${
                  (deltas.totalSales ?? 0) >= 0 ? "higher" : "lower"
                } than the previous period.`}
              />
              <InsightCard
                icon={Star}
                iconBg="bg-warning/12 text-warning-text"
                title="Top category"
                description={
                  summary?.categoryBreakdown?.length
                    ? `${summary.categoryBreakdown[0].name} leads with ${summary.categoryBreakdown[0].value}% of sales.`
                    : "No category data for this period yet."
                }
              />
              <InsightCard
                icon={Target}
                iconBg="bg-success/12 text-success-text"
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
