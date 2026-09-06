// src/components/ui/Layout.jsx
//
// Composition primitives that build hierarchy with whitespace, typography and
// dividers instead of nested bordered cards (DESIGN.md §3, §11 KPI/Metric).

/**
 * An open content group. No border, no card — just a heading and its content,
 * separated from siblings by spacing. Use this instead of <Card> for most
 * dashboard / detail regions.
 *
 * `divide` draws a single hairline under the header.
 */
export function Section({ title, description, action, divide = false, className = "", children }) {
  return (
    <section className={className}>
      {(title || action) && (
        <div
          className={`flex items-end justify-between gap-4 ${
            divide ? "border-b border-border-default pb-2.5 mb-4" : "mb-3"
          }`}
        >
          <div>
            {title && <h2 className="type-section text-text-primary">{title}</h2>}
            {description && (
              <p className="type-body-sm text-text-secondary mt-0.5">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Screen title block — one per screen, lives in the page not the shell. */
export function PageHeader({ title, description, children, className = "" }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div>
        <h1 className="type-heading-lg text-text-primary">{title}</h1>
        {description && (
          <p className="type-body-sm text-text-secondary mt-1">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

/**
 * A row of metric tiles that share one quiet surface, split by hairlines —
 * the antidote to four identically-bordered KPI cards (DESIGN.md §11).
 */
export function KpiGroup({ className = "", children }) {
  return (
    <div
      className={`grid rounded-lg border border-border-default bg-surface-panel divide-x divide-border-default overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * One metric. Value dominates (type-stat); label above and delta below are
 * quiet. Optional leading icon is bare — no coloured square.
 */
export function KpiTile({
  label,
  value,
  delta,
  deltaTone = "muted",
  icon: Icon,
  onClick,
  loading = false,
  className = "",
}) {
  const Comp = onClick ? "button" : "div";
  const deltaClass =
    deltaTone === "up"
      ? "text-success-text"
      : deltaTone === "down"
      ? "text-error-text"
      : "text-text-muted";
  return (
    <Comp
      onClick={onClick}
      className={`flex flex-col gap-1.5 px-4 py-3.5 text-left ${
        onClick ? "hover:bg-surface-sunken transition-colors" : ""
      } ${className}`}
    >
      <span className="flex items-center gap-1.5 type-body-sm text-text-secondary">
        {Icon && <Icon size={14} className="text-text-muted" />}
        {label}
      </span>
      {loading ? (
        <span className="block h-[26px] w-24 rounded bg-surface-elevated animate-pulse" />
      ) : (
        <span className="type-stat text-text-primary">{value}</span>
      )}
      {delta && <span className={`type-caption ${deltaClass}`}>{delta}</span>}
    </Comp>
  );
}
