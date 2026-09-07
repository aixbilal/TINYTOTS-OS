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
import { Select } from "../components/ui/Input";
import { PageHeader, KpiGroup } from "../components/ui/Layout";
import ReportRecipients from "../components/reports/ReportRecipients";

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
    <div className="mx-auto max-w-[1600px] flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="A consolidated sales and performance review for the selected period."
      >
        <Select value={range} onChange={(e) => changeRange(e.target.value)} className="!py-2 h-9">
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </PageHeader>

      <ReportRecipients />

      {error ? (
        <div className="rounded-lg border border-border-default bg-surface-panel">
          <ErrorState onRetry={retry} />
        </div>
      ) : loading && !summary ? (
        <div className="rounded-lg border border-border-default bg-surface-panel">
          <LoadingState label="Loading report…" />
        </div>
      ) : (
        <>
          {/* KPI summary — one hairline-split surface */}
          <KpiGroup className="grid-cols-2 md:grid-cols-3 xl:grid-cols-5 divide-y md:divide-y-0">
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
          </KpiGroup>

          {/* Sales trend + goal progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <SalesOverviewChart
                data={summary?.dailySeries || []}
                title={`Sales Trend · ${rangeLabel}`}
              />
            </div>
            <div className="rounded-lg border border-border-default bg-surface-panel p-5">
              <h3 className="type-section text-text-primary mb-4">Goal Progress</h3>
              {summary?.goal ? (
                <div className="space-y-3">
                  <p className="type-stat text-text-primary">
                    {summary.goal.percent}%
                  </p>
                  <div className="h-2.5 bg-surface-secondary rounded-full overflow-hidden">
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
            <CategoryDonut data={categoryBreakdown} title="Sales by Category" />
            <div className="lg:col-span-2 flex flex-col gap-2">
              <h3 className="type-section text-text-primary">
                Category Breakdown · {rangeLabel}
              </h3>
              {categoryBreakdown.length === 0 ? (
                <div className="rounded-lg border border-border-default bg-surface-panel">
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
