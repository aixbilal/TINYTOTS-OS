// src/components/ui/States.jsx
import { Loader2, Inbox, AlertTriangle } from "lucide-react";
import Button from "./Button";

/** Inline loading indicator for a section of a screen. */
export function LoadingState({ label = "Loading…", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-ink-700/70 ${className}`}>
      <Loader2 size={28} className="animate-spin text-maroon-700" />
      <p className="type-body-sm">{label}</p>
    </div>
  );
}

/** Shown when a list/section has no data yet. */
export function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description,
  action,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-center ${className}`}>
      <div className="w-14 h-14 rounded-full bg-cream-100 flex items-center justify-center text-ink-700/50">
        <Icon size={24} strokeWidth={1.6} />
      </div>
      <div>
        <p className="type-card-title text-ink-900">{title}</p>
        {description && (
          <p className="type-body-sm text-ink-700/70 mt-1 max-w-sm">{description}</p>
        )}
      </div>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}

/** Shown when a section fails to load. */
export function ErrorState({
  title = "Something went wrong",
  description = "Please try again.",
  onRetry,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-center ${className}`}>
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600">
        <AlertTriangle size={24} strokeWidth={1.6} />
      </div>
      <div>
        <p className="type-card-title text-ink-900">{title}</p>
        <p className="type-body-sm text-ink-700/70 mt-1 max-w-sm">{description}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}
