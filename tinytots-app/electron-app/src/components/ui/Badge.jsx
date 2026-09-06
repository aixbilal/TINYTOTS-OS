// src/components/ui/Badge.jsx

// Semantic colors reuse the same Tailwind shades already used for status
// communication elsewhere in the app (App.jsx online/offline, NotificationBell
// priority styles) — nothing new invented here.
const VARIANTS = {
  neutral: "bg-cream-100 text-ink-700 border-gold-300/40",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function Badge({ variant = "neutral", className = "", children }) {
  return (
    <span
      className={`type-label inline-flex items-center rounded-full border px-2.5 py-1 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
