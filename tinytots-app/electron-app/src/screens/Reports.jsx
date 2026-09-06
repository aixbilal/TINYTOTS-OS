import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  ShoppingBag,
  ShoppingCart,
  Package,
  TrendingUp,
  Target,
} from "lucide-react";
import KpiCard from "../components/performance/KpiCard";
import SalesOverviewChart from "../components/performance/SalesOverviewChart";
import CategoryDonut from "../components/performance/CategoryDonut";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";

/**
 * Consolidated business report surface. Built entirely from the existing
 * GET /api/performance/summary contract (no new calculations) — where the
 * Performance screen is analysis + goal-setting, this is a period review:
 * range selector, headline KPIs, the sales trend, and a category breakdown
 * table. Range values are exactly the ones the backend recognises.
 */
const RANGE_OPTIONS = [
  { value: "month", label: "This Month" },
  { value: "3month", label: "Last 3 Months" },
  { value: "6month", label: "Last 6 Months" },
  { value: "12month", label: "Last 12 Months" },
  { value: "all", label: "Since Launch" },
];

const pkr = (v) => `Rs. ${Math.round(Number(v || 0)).toLocaleString("en-PK")}`;

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState("month");

  const loadSummary = useCallback(() => {
    fetch(`http://localhost:3000/api/performance/summary?range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSummary(data);
          setError(false);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  function changeRange(value) {
    setRange(value);
    setLoading(true);
    setError(false);
  }

  function retry() {
    setLoading(true);
    setError(false);
    loadSummary();
  }

  const kpis = summary?.kpis;
  const deltas = kpis?.deltas || {};
  const rangeLabel = RANGE_OPTIONS.find((r) => r.value === range)?.label;
  const categoryBreakdown = summary?.categoryBreakdown || [];

  return (
    <div className="mx-auto max-w-[1600px] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="type-heading-lg text-text-primary">Reports</h1>
          <p className="type-body-sm text-text-secondary mt-0.5">
            A consolidated sales and performance review for the selected period.
          </p>
        </div>
        <select
          value={range}
          onChange={(e) => changeRange(e.target.value)}
          className="type-input rounded-lg border border-border-strong bg-surface-elevated px-3 py-2 text-text-primary outline-none focus:border-brand"
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <ErrorState onRetry={retry} />
        </div>
      ) : loading && !summary ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <LoadingState label="Loading report…" />
        </div>
      ) : (
        <>
          {/* KPI summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <KpiCard
              icon={Banknote}
              label="Total Sales"
              value={pkr(kpis?.totalSales)}
              delta={deltas.totalSales}
              deltaLabel="vs previous period"
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
              icon={TrendingUp}
              label="Gross Profit"
              value={pkr(kpis?.grossProfit)}
              delta={deltas.grossProfit}
              deltaLabel="vs previous period"
            />
          </div>

          {/* Sales trend + goal progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <SalesOverviewChart
                data={summary?.dailySeries || []}
                title={`Sales Trend · ${rangeLabel}`}
                theme="warm"
              />
            </div>
            <div className="rounded-xl border border-border-default bg-surface-panel p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-8 h-8 rounded-lg bg-brand/12 text-brand flex items-center justify-center">
                  <Target size={16} />
                </span>
                <h3 className="type-section text-text-primary">Goal Progress</h3>
              </div>
              {summary?.goal ? (
                <div className="space-y-3">
                  <p className="type-stat text-text-primary">
                    {summary.goal.percent}%
                  </p>
                  <div className="h-2.5 bg-surface-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full"
                      style={{
                        width: `${Math.min(summary.goal.percent, 100)}%`,
                      }}
                    />
                  </div>
                  <dl className="grid grid-cols-2 gap-y-2 type-body-sm">
                    <dt className="text-text-muted">Target</dt>
                    <dd className="text-text-primary text-right">
                      {pkr(summary.goal.target)}
                    </dd>
                    <dt className="text-text-muted">Achieved</dt>
                    <dd className="text-text-primary text-right">
                      {pkr(summary.goal.achieved)}
                    </dd>
                    <dt className="text-text-muted">Remaining</dt>
                    <dd className="text-text-primary text-right">
                      {pkr(summary.goal.remaining)}
                    </dd>
                  </dl>
                </div>
              ) : (
                <EmptyState
                  icon={Target}
                  title="No active goal"
                  description="Set a goal from the Performance screen to track progress here."
                  className="py-8"
                />
              )}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <CategoryDonut
              data={categoryBreakdown}
              title="Sales by Category"
              theme="warm"
            />
            <div className="lg:col-span-2 flex flex-col gap-2">
              <h3 className="type-section text-text-primary">
                Category Breakdown · {rangeLabel}
              </h3>
              {categoryBreakdown.length === 0 ? (
                <div className="rounded-xl border border-border-default bg-surface-panel">
                  <EmptyState
                    title="No category data for this period"
                    description="Category performance appears once sales are recorded."
                    className="py-10"
                  />
                </div>
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Category</TH>
                      <TH align="right">Share of Sales</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {categoryBreakdown.map((c) => (
                      <TR key={c.name}>
                        <TD className="font-medium">{c.name}</TD>
                        <TD align="right" className="text-text-secondary">
                          {c.value}%
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
