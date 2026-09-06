// src/components/ui/Card.jsx

/**
 * Elevated functional surface (DESIGN.md §3, §11). A "card" is *earned* — a
 * table, a dialog, a chart panel with real chrome, or a form group that must
 * read as one contained unit. For everything else prefer an open <Section>.
 *
 * White surface, single hairline border, radius-lg, no shadow at rest.
 * `flush` drops the padding (for a table that draws its own).
 * `glass` is accepted from older call sites but is a no-op.
 */
export default function Card({ className = "", flush = false, style, children, ...rest }) {
  delete rest.glass;
  return (
    <div
      className={`rounded-lg border border-border-default bg-surface-panel ${
        flush ? "" : "p-5"
      } ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className = "" }) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div>
        <h3 className="type-card-title text-text-primary">{title}</h3>
        {description && (
          <p className="type-body-sm text-text-secondary mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
