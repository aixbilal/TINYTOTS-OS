// src/components/ui/States.jsx
import { Loader2, Inbox, AlertTriangle } from "lucide-react";
import Button from "./Button";

/** Inline loading indicator for a section of a screen. */
export function LoadingState({ label = "Loading…", className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-14 text-text-secondary ${className}`}
    >
      <Loader2 size={26} className="animate-spin text-brand" />
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
    <div
      className={`flex flex-col items-center justify-center gap-3 py-14 text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-surface-elevated flex items-center justify-center text-text-muted">
        <Icon size={22} strokeWidth={1.6} />
      </div>
      <div>
        <p className="type-card-title text-text-primary">{title}</p>
        {description && (
          <p className="type-body-sm text-text-secondary mt-1 max-w-sm">
            {description}
          </p>
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
  description = "We couldn't load the data. Please try again.",
  onRetry,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-14 text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-error/12 flex items-center justify-center text-error-text">
        <AlertTriangle size={22} strokeWidth={1.6} />
      </div>
      <div>
        <p className="type-card-title text-text-primary">{title}</p>
        <p className="type-body-sm text-text-secondary mt-1 max-w-sm">{description}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}
