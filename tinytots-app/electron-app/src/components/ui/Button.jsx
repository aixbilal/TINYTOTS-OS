// src/components/ui/Button.jsx
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "bg-maroon-700 text-cream-50 hover:bg-maroon-800 disabled:hover:bg-maroon-700",
  secondary:
    "bg-white text-ink-900 border border-gold-300/50 hover:bg-cream-100 disabled:hover:bg-white",
  ghost: "bg-transparent text-ink-900 hover:bg-cream-100 disabled:hover:bg-transparent",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600",
};

const SIZES = {
  sm: "px-3 py-1.5 gap-1.5",
  md: "px-4 py-2.5 gap-2",
  lg: "px-6 py-3 gap-2",
};

/**
 * Shared button primitive. Consumes the existing maroon/gold/cream palette and
 * `.type-btn` scale already defined in styles/typography.css — no new values invented.
 */
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
      className={`type-btn inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
