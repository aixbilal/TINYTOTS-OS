// src/components/ui/Card.jsx

/**
 * Shared panel surface for the dark operational system: a solid elevated
 * surface with a hairline border and restrained corner radius. No glass,
 * no drop shadow — panels are separated from the app background by tone
 * and border only (see 05-16 Surface System).
 *
 * The `glass` prop is retained for API compatibility with older callers
 * but is intentionally a no-op now.
 */
export default function Card({ className = "", style, children, ...rest }) {
  // `glass` is accepted from older call sites but is a no-op now; keep it off
  // the DOM node.
  delete rest.glass;
  return (
    <div
      className={`rounded-xl border border-border-default bg-surface-panel p-5 ${className}`}
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
