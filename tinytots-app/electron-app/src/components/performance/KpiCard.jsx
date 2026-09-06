import { TrendingUp, TrendingDown } from "lucide-react";

/**
 * Compact KPI tile for the dark operational system: icon chip, label,
 * primary value, and a signed delta line. `delta` is a real percentage
 * supplied by the caller — pass `deltaLabel` to change the comparison text.
 */
export default function KpiCard({ icon: Icon, label, value, delta, deltaLabel = "vs last month" }) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;
  return (
    <div className="flex-1 min-w-[180px] rounded-xl border border-border-default bg-surface-panel p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-lg bg-surface-elevated border border-border-default flex items-center justify-center text-text-secondary">
          <Icon size={16} />
        </span>
        <p className="type-body-sm text-text-secondary">{label}</p>
      </div>
      <p className="type-stat text-text-primary">{value}</p>
      {hasDelta && (
        <div
          className={`mt-1.5 flex items-center gap-1 type-caption font-medium ${
            up ? "text-success-text" : "text-error-text"
          }`}
        >
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(delta).toFixed(1)}% {deltaLabel}
        </div>
      )}
    </div>
  );
}
