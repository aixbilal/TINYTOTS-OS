// src/components/ui/Button.jsx
import { Loader2 } from "lucide-react";

/**
 * Shared button primitive (DESIGN.md §11).
 *
 * - primary   : olive fill, the single dominant action on a view
 * - secondary : quiet warm surface + hairline border — NOT a heavy outline
 * - ghost     : borderless, for secondary navigation / low-emphasis actions
 * - danger    : red fill, destructive confirms only
 * - subtle    : ghost-weight square, for icon-only affordances (pass aria-label)
 *
 * All colours resolve from semantic tokens, so a button adapts to whichever
 * palette scope contains it (canvas, white surface, or the inverse sidebar).
 */
const VARIANTS = {
  primary:
    "bg-brand text-pure-white hover:bg-brand-hover active:bg-brand-active disabled:hover:bg-brand shadow-sm",
  secondary:
    "bg-surface-panel text-text-primary border border-border-default hover:bg-surface-sunken hover:border-border-strong disabled:hover:bg-surface-panel",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-elevated hover:text-text-primary disabled:hover:bg-transparent",
  danger:
    "bg-error text-pure-white hover:brightness-110 active:brightness-95 disabled:hover:brightness-100 shadow-sm",
  subtle:
    "bg-transparent text-text-secondary hover:bg-surface-elevated hover:text-text-primary disabled:hover:bg-transparent",
};

const SIZES = {
  sm: "px-3 py-1.5 gap-1.5 rounded-md",
  md: "px-4 py-2 gap-2 rounded-md",
  lg: "px-5 py-2.5 gap-2 rounded-lg",
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
      className={`type-btn inline-flex items-center justify-center transition-[background-color,border-color,color,filter,transform] outline-none focus-visible:ring-2 focus-visible:ring-brand/55 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app active:translate-y-px disabled:opacity-45 disabled:cursor-not-allowed disabled:active:translate-y-0 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}
