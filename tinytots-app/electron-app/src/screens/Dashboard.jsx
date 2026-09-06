import { useEffect, useMemo, useState } from "react";
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
import { getGreeting } from "../lib/greetings";
import { timeAgoShort } from "../lib/time";
import SalesOverviewChart from "../components/performance/SalesOverviewChart";
import GoalSummaryCard from "../components/performance/GoalSummaryCard";
import CategoryDonut from "../components/performance/CategoryDonut";
import { EmptyState } from "../components/ui/States";
import { PageHeader, Section, KpiRow, KpiTile } from "../components/ui/Layout";

const ACTIVITY_ICONS = {
  inventory: Package,
  sales: ShoppingBag,
  employee: Users,
  system: Server,
  goal: Target,
};

// Restrained semantic icon wells — same tint language as the KPI tiles.
const ACTIVITY_WELLS = {
  inventory: "bg-warning/12 text-warning-text",
  sales: "bg-success/12 text-success-text",
  employee: "bg-info/12 text-info-text",
  goal: "bg-brand-soft text-brand",
  system: "bg-surface-elevated text-text-secondary",
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

  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Deterministic per user / day / time band — computed once so it never
  // flickers between re-renders (see src/lib/greetings.js).
  const greeting = useMemo(
    () => getGreeting(session),
    // session identity is stable for the life of this screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const orders = summary?.transactionsToday ?? 0;
  const aov = orders > 0 ? summary.totalSalesToday / orders : 0;

  const kpis = [
    {
      label: "Total Sales",
      icon: Banknote,
      tone: "sales",
      value: summary ? pkr(summary.totalSalesToday) : null,
    },
    {
      label: "Orders",
      icon: ShoppingBag,
      tone: "orders",
      value: summary ? String(summary.transactionsToday) : null,
    },
    {
      label: "Avg Order Value",
      icon: ShoppingCart,
      tone: "info",
      value: summary ? pkr(aov) : null,
    },
    {
      label: "Low Stock Items",
      icon: AlertTriangle,
      tone: "warning",
      value: summary ? String(summary.lowStockCount) : null,
      onClick: isAdmin ? () => navigate("/low-stock") : undefined,
    },
    {
      label: "Goal Progress",
      icon: Target,
      tone: "goal",
      value: summary
        ? summary.goalProgressPct != null
          ? `${summary.goalProgressPct}%`
          : "No goal"
        : null,
      onClick: isAdmin ? () => navigate("/performance") : undefined,
    },
  ];

  const quickActions = [
    { label: "New Sale", hint: "Open POS", icon: ShoppingCart, to: "/pos", well: "bg-brand text-pure-white", show: true },
    { label: "Add Product", hint: "Create new", icon: Package, to: "/inventory", well: "bg-success/12 text-success-text", show: isAdmin },
    { label: "Manage Inventory", hint: "Stock & variants", icon: Boxes, to: "/inventory", well: "bg-brand-soft text-brand", show: isAdmin },
    { label: "Generate Barcode", hint: "For products", icon: Barcode, to: "/inventory", well: "bg-surface-elevated text-text-secondary", show: isAdmin },
    { label: "View Reports", hint: "Analytics", icon: TrendingUp, to: "/performance", well: "bg-info/12 text-info-text", show: isAdmin },
    { label: "Old Receipts", hint: "All receipts", icon: ScrollText, to: "/receipts", well: "bg-accent/12 text-accent", show: isAdmin },
  ].filter((a) => a.show);

  return (
    <div className="mx-auto max-w-[1600px] flex flex-col gap-7">
      <PageHeader
        title={greeting}
        description="Here's what's happening with your store today."
      >
        <span className="type-body-sm text-text-muted">{dateLabel}</span>
      </PageHeader>

      {/* KPI row — borderless semantic tiles on the canvas (§26) */}
      <KpiRow className="grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <KpiTile
            key={k.label}
            label={k.label}
            icon={k.icon}
            tone={k.tone}
            value={k.value ?? (summaryError ? "—" : "")}
            onClick={k.onClick}
            loading={!summary && !summaryError}
          />
        ))}
      </KpiRow>

      {/* Sales overview + goal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {perfError ? (
            <div className="rounded-lg border border-border-default bg-surface-panel p-5 h-full">
              <h3 className="type-section text-text-primary mb-2">Sales Overview</h3>
              <EmptyState
                title="Sales trend unavailable"
                description="Performance data couldn't be loaded right now."
              />
            </div>
          ) : (
            <SalesOverviewChart data={perf?.dailySeries || []} />
          )}
        </div>
        <GoalSummaryCard
          goal={perf?.goal}
          onViewDetails={isAdmin ? () => navigate("/performance") : undefined}
        />
      </div>

      {/* Low stock + categories + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-7">
        <LowStockPanel items={lowStock} onViewAll={() => navigate("/low-stock")} />
        {perfError ? (
          <Section title="Top Selling Categories">
            <EmptyState title="Unavailable" description="Category data couldn't be loaded." />
          </Section>
        ) : (
          <CategoryDonut data={perf?.categoryBreakdown} bare title={null} />
        )}
        <ActivityPanel items={activity} />
      </div>

      {/* Quick actions — open section, borderless tiles with semantic wells */}
      <Section title="Quick Actions" divide>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => navigate(a.to)}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-[background-color,transform] hover:bg-surface-elevated active:translate-y-px active:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45"
              >
                <span
                  className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-[1.06] ${a.well}`}
                >
                  <Icon size={16} strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block type-body-sm font-semibold text-text-primary truncate">
                    {a.label}
                  </span>
                  <span className="block type-caption text-text-muted truncate">{a.hint}</span>
                </span>
                <ChevronRight
                  size={14}
                  className="shrink-0 text-text-muted opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                />
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function LowStockPanel({ items, onViewAll }) {
  return (
    <Section
      title="Low Stock Items"
      divide
      action={
        <button
          onClick={onViewAll}
          className="type-caption text-brand hover:underline inline-flex items-center gap-0.5"
        >
          View all <ChevronRight size={12} />
        </button>
      }
    >
      {items === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-10 rounded-md bg-surface-elevated animate-pulse" />
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
        <ul className="divide-y divide-border-default/70">
          {items.slice(0, 5).map((it) => (
            <li
              key={it.variantId}
              className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-md hover:bg-surface-elevated/60 transition-colors"
            >
              {it.imageUrl ? (
                <img
                  src={it.imageUrl}
                  alt=""
                  loading="lazy"
                  className="w-9 h-9 rounded-md object-cover shrink-0 bg-surface-elevated"
                />
              ) : (
                <span className="w-9 h-9 rounded-md bg-surface-elevated flex items-center justify-center text-text-muted shrink-0">
                  <Package size={15} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="type-body-sm font-medium text-text-primary truncate">{it.name}</p>
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
    </Section>
  );
}

function ActivityPanel({ items }) {
  return (
    <Section title="Recent Activity" divide>
      {items === null ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="block h-9 rounded-md bg-surface-elevated animate-pulse" />
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
        <ul className="divide-y divide-border-default/70">
          {items.map((n) => {
            const Icon = ACTIVITY_ICONS[n.category] || Activity;
            const well = ACTIVITY_WELLS[n.category] || ACTIVITY_WELLS.system;
            return (
              <li
                key={n.id}
                className="flex items-start gap-3 py-2.5 -mx-2 px-2 rounded-md hover:bg-surface-elevated/60 transition-colors"
              >
                <span
                  className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${well}`}
                >
                  <Icon size={14} strokeWidth={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="type-body-sm font-medium text-text-primary truncate">{n.title}</p>
                    {n.created_at && (
                      <span className="type-tiny text-text-muted shrink-0 tabular-nums">
                        {timeAgoShort(n.created_at)}
                      </span>
                    )}
                  </div>
                  {n.description && (
                    <p className="type-caption text-text-muted truncate">{n.description}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
