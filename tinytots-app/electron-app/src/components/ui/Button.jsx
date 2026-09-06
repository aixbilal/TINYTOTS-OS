// src/components/ui/Button.jsx
import { Loader2 } from "lucide-react";

/**
 * Shared button primitive. Reference-driven dark system: a filled coral-red
 * primary reserved for the dominant action on a view, a quiet elevated
 * secondary, a borderless ghost, and a red danger for destructive confirms.
 */
const VARIANTS = {
  primary:
    "bg-brand text-pure-white hover:bg-brand-hover active:bg-brand-active disabled:hover:bg-brand",
  secondary:
    "bg-surface-elevated text-text-primary border border-border-strong hover:bg-[#26262c] disabled:hover:bg-surface-elevated",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-elevated hover:text-text-primary disabled:hover:bg-transparent",
  danger:
    "bg-error text-pure-white hover:brightness-110 disabled:hover:brightness-100",
};

const SIZES = {
  sm: "px-3 py-1.5 gap-1.5",
  md: "px-4 py-2 gap-2",
  lg: "px-5 py-2.5 gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...rest
}) {
  return (
    <button
      className={`type-btn inline-flex items-center justify-center rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app disabled:opacity-45 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}
