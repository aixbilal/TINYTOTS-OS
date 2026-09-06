// src/components/ui/Badge.jsx

// Dark-system status pills: a tinted fill + matching text + hairline ring,
// legible on the near-black app surface. Status is always paired with a
// label (and, at call sites, an icon) — never colour alone.
const VARIANTS = {
  neutral: "bg-surface-elevated text-text-secondary ring-border-strong",
  success: "bg-success/12 text-success-text ring-success/30",
  warning: "bg-warning/12 text-warning-text ring-warning/30",
  error: "bg-error/12 text-error-text ring-error/30",
  info: "bg-info/12 text-info-text ring-info/30",
};

export default function Badge({ variant = "neutral", className = "", children }) {
  return (
    <span
      className={`type-label inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ring-1 ring-inset ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
