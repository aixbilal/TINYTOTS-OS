// src/components/ui/Badge.jsx

// Small status pills (DESIGN.md §11 Badge). Low-saturation semantic fill +
// matching text + a faint inset ring. Status is always paired with a label
// (and often an icon at the call site) — never colour alone.
const VARIANTS = {
  neutral: "bg-surface-elevated text-text-secondary ring-border-strong/60",
  brand: "bg-brand-soft text-brand ring-brand/25",
  success: "bg-success/10 text-success-text ring-success/25",
  warning: "bg-warning/10 text-warning-text ring-warning/25",
  error: "bg-error/10 text-error-text ring-error/25",
  info: "bg-info/10 text-info-text ring-info/25",
};

export default function Badge({ variant = "neutral", className = "", children }) {
  return (
    <span
      className={`type-label inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ring-1 ring-inset whitespace-nowrap ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
