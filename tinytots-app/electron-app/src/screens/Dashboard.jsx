import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  ShoppingBag,
  ShoppingCart,
  AlertTriangle,
  Target,
  Package,
  Barcode,
  ScrollText,
  TrendingUp,
  ChevronRight,
  Activity,
  Users,
  Server,
  Boxes,
} from "lucide-react";
import { getSession } from "../auth";
import SalesOverviewChart from "../components/performance/SalesOverviewChart";
import GoalSummaryCard from "../components/performance/GoalSummaryCard";
import CategoryDonut from "../components/performance/CategoryDonut";
import { EmptyState } from "../components/ui/States";

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
}

const ACTIVITY_ICONS = {
  inventory: Package,
  sales: ShoppingBag,
  employee: Users,
  system: Server,
  goal: Target,
};

const pkr = (v) => `Rs. ${Math.round(Number(v || 0)).toLocaleString("en-PK")}`;

export default function Dashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const isAdmin = session?.role === "admin";

  const [summary, setSummary] = useState(null); // /api/dashboard-summary
  const [summaryError, setSummaryError] = useState(false);
  const [perf, setPerf] = useState(null); // /api/performance/summary
  const [perfError, setPerfError] = useState(false);
  const [lowStock, setLowStock] = useState(null);
  const [activity, setActivity] = useState(session ? null : []);

  useEffect(() => {
    let ignore = false;

    fetch("http://localhost:3000/api/dashboard-summary")
      .then((r) => r.json())
      .then((d) => {
        if (ignore) return;
        if (d.success) setSummary(d);
        else setSummaryError(true);
      })
      .catch(() => !ignore && setSummaryError(true));

    fetch("http://localhost:3000/api/performance/summary?range=month")
      .then((r) => r.json())
      .then((d) => {
        if (ignore) return;
        if (d.success) setPerf(d);
        else setPerfError(true);
      })
      .catch(() => !ignore && setPerfError(true));

    fetch("http://localhost:3000/api/low-stock")
      .then((r) => r.json())
      .then((d) => !ignore && setLowStock(d.success ? d.items : []))
      .catch(() => !ignore && setLowStock([]));

    if (session) {
      const params = new URLSearchParams({
        role: session.role,
        username: session.username,
      });
      fetch(`http://localhost:3000/api/notifications?${params.toString()}`)
        .then((r) => r.json())
        .then((d) => !ignore && setActivity(d.success ? d.notifications.slice(0, 5) : []))
        .catch(() => !ignore && setActivity([]));
    }

    return () => {
      ignore = true;
    };
    // session identity is stable for the life of this screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const orders = summary?.transactionsToday ?? 0;
  const aov = orders > 0 ? summary.totalSalesToday / orders : 0;

  const kpis = [
    {
      label: "Total Sales",
      icon: Banknote,
      value: summary ? pkr(summary.totalSalesToday) : null,
    },
    {
      label: "Orders",
      icon: ShoppingBag,
      value: summary ? String(summary.transactionsToday) : null,
    },
    {
      label: "Avg Order Value",
      icon: ShoppingCart,
      value: summary ? pkr(aov) : null,
    },
    {
      label: "Low Stock Items",
      icon: AlertTriangle,
      value: summary ? String(summary.lowStockCount) : null,
      onClick: isAdmin ? () => navigate("/low-stock") : undefined,
    },
    {
      label: "Goal Progress",
      icon: Target,
      value: summary
        ? summary.goalProgressPct != null
          ? `${summary.goalProgressPct}%`
          : "No goal"
        : null,
      onClick: isAdmin ? () => navigate("/performance") : undefined,
    },
  ];

  const quickActions = [
    { label: "New Sale", hint: "Open POS", icon: ShoppingCart, to: "/pos", show: true },
    { label: "Add Product", hint: "Create new", icon: Package, to: "/inventory", show: isAdmin },
    { label: "Manage Inventory", hint: "Stock & variants", icon: Boxes, to: "/inventory", show: isAdmin },
    { label: "Generate Barcode", hint: "For products", icon: Barcode, to: "/inventory", show: isAdmin },
    { label: "View Reports", hint: "Analytics", icon: TrendingUp, to: "/performance", show: isAdmin },
    { label: "Old Receipts", hint: "All receipts", icon: ScrollText, to: "/receipts", show: isAdmin },
  ].filter((a) => a.show);

  return (
    <div className="mx-auto max-w-[1600px] flex flex-col gap-5">
      {/* Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="type-body-sm text-text-secondary">{timeGreeting()}</p>
          <h1 className="type-heading-lg text-text-primary mt-0.5">
            {session?.name || "Retailer"} <span aria-hidden>👋</span>
          </h1>
          <p className="type-body-sm text-text-secondary mt-1">
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface-panel px-3 py-1.5 type-body-sm text-text-secondary">
          {dateLabel}
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <Stat
            key={k.label}
            {...k}
            error={summaryError}
            loading={!summary && !summaryError}
          />
        ))}
      </div>

      {/* Sales overview + goal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {perfError ? (
            <div className="rounded-xl border border-border-default bg-surface-panel p-5 h-full">
              <h3 className="type-section text-text-primary mb-2">Sales Overview</h3>
              <EmptyState
                title="Sales trend unavailable"
                description="Performance data couldn't be loaded right now."
              />
            </div>
          ) : (
            <SalesOverviewChart data={perf?.dailySeries || []} theme="warm" />
          )}
        </div>
        <GoalSummaryCard
          goal={perf?.goal}
          onViewDetails={isAdmin ? () => navigate("/performance") : undefined}
          theme="warm"
        />
      </div>

      {/* Low stock + categories + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <LowStockPanel items={lowStock} onViewAll={() => navigate("/low-stock")} />
        {perfError ? (
          <div className="rounded-xl border border-border-default bg-surface-panel p-5">
            <h3 className="type-section text-text-primary mb-2">Top Selling Categories</h3>
            <EmptyState title="Unavailable" description="Category data couldn't be loaded." />
          </div>
        ) : (
          <CategoryDonut data={perf?.categoryBreakdown} theme="warm" />
        )}
        <ActivityPanel items={activity} />
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-border-default bg-surface-panel p-4">
        <p className="type-section text-text-primary mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => navigate(a.to)}
                className="flex items-center gap-3 rounded-lg border border-border-default bg-surface-elevated/50 px-3 py-2.5 text-left hover:bg-surface-elevated hover:border-border-strong transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-brand/12 text-brand flex items-center justify-center shrink-0">
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block type-body-sm font-medium text-text-primary truncate">
                    {a.label}
                  </span>
                  <span className="block type-caption text-text-muted truncate">
                    {a.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, icon: Icon, value, onClick, loading, error }) {
  const display = value ?? (error ? "—" : null);
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`rounded-xl border border-border-default bg-surface-panel p-4 text-left ${
        onClick ? "hover:border-border-strong transition-colors" : ""
      }`}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-lg bg-surface-elevated border border-border-default flex items-center justify-center text-text-secondary">
          <Icon size={16} />
        </span>
        <p className="type-body-sm text-text-secondary">{label}</p>
      </div>
      {loading ? (
        <span className="block h-6 w-24 rounded bg-surface-elevated animate-pulse" />
      ) : (
        <p className="type-stat text-text-primary">{display}</p>
      )}
    </Comp>
  );
}

function LowStockPanel({ items, onViewAll }) {
  return (
    <div className="rounded-xl border border-border-default bg-surface-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="type-section text-text-primary">Low Stock Items</h3>
        <button
          onClick={onViewAll}
          className="type-caption text-brand hover:underline inline-flex items-center gap-0.5"
        >
          View All <ChevronRight size={12} />
        </button>
      </div>
      {items === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-10 rounded-lg bg-surface-elevated animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Stock looks healthy"
          description="Nothing is at or below the reorder threshold."
          className="py-8"
        />
      ) : (
        <ul className="divide-y divide-border-default -mt-1">
          {items.slice(0, 5).map((it) => (
            <li key={it.variantId} className="flex items-center gap-3 py-2.5">
              <span className="w-9 h-9 rounded-lg bg-surface-elevated border border-border-default flex items-center justify-center text-text-muted shrink-0">
                <Package size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="type-body-sm font-medium text-text-primary truncate">
                  {it.name}
                </p>
                <p className="type-caption text-text-muted truncate">
                  {[it.size, it.color].filter(Boolean).join(" / ") || it.publicCode || "—"}
                </p>
              </div>
              <span
                className={`type-label shrink-0 ${
                  it.stock <= 0 ? "text-error-text" : "text-warning-text"
                }`}
              >
                {it.stock <= 0 ? "Out" : `Stock: ${it.stock}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityPanel({ items }) {
  return (
    <div className="rounded-xl border border-border-default bg-surface-panel p-5">
      <h3 className="type-section text-text-primary mb-3">Recent Activity</h3>
      {items === null ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="block h-9 rounded-lg bg-surface-elevated animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No recent activity"
          description="Sales, stock changes and alerts show up here."
          className="py-8"
        />
      ) : (
        <ul className="space-y-1 -mt-0.5">
          {items.map((n) => {
            const Icon = ACTIVITY_ICONS[n.category] || Activity;
            return (
              <li key={n.id} className="flex items-start gap-3 py-1.5">
                <span className="w-8 h-8 rounded-lg bg-surface-elevated border border-border-default flex items-center justify-center text-text-secondary shrink-0">
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="type-body-sm text-text-primary truncate">{n.title}</p>
                  {n.description && (
                    <p className="type-caption text-text-muted truncate">
                      {n.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
