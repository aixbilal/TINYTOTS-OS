// src/components/ui/Card.jsx

/**
 * Shared card surface. `rounded-2xl` matches the radius already used
 * throughout the app (Dashboard module cards, Header panel, Snapshot bar).
 * Pass `glass` for the existing frosted-glass treatment instead of a solid
 * white surface.
 */
export default function Card({
  glass = false,
  className = "",
  style,
  children,
  ...rest
}) {
  const glassStyle = glass
    ? {
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
        ...style,
      }
    : style;

  return (
    <div
      className={`rounded-2xl p-6 ${
        glass
          ? "border border-white/40 backdrop-blur-xl"
          : "border border-gold-300/30 bg-white shadow-sm"
      } ${className}`}
      style={glassStyle}
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
        <h3 className="type-card-title text-ink-900">{title}</h3>
        {description && (
          <p className="type-body-sm text-ink-700/70 mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
