import { TrendingUp, TrendingDown } from "lucide-react";

/**
 * Compact KPI tile (DESIGN.md §11 KPI/Metric): label, dominant value, quiet
 * signed delta. Open — no border, no icon-in-a-square. `delta` is a real
 * percentage supplied by the caller.
 */
export default function KpiCard({ icon: Icon, label, value, delta, deltaLabel = "vs last month" }) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;
  return (
    <div className="flex flex-col gap-1.5 px-4 py-3.5">
      <span className="flex items-center gap-1.5 type-body-sm text-text-secondary">
        {Icon && <Icon size={14} className="text-text-muted" />}
        {label}
      </span>
      <p className="type-stat text-text-primary">{value}</p>
      {hasDelta && (
        <div
          className={`flex items-center gap-1 type-caption font-medium ${
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
