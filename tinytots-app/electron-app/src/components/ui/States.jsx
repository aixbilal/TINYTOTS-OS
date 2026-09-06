// src/components/ui/States.jsx
import { Loader2, Inbox, AlertTriangle } from "lucide-react";
import Button from "./Button";

/** Inline loading indicator for a section of a screen (DESIGN.md §11 States). */
export function LoadingState({ label = "Loading…", className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-14 text-text-secondary ${className}`}
    >
      <Loader2 size={22} className="animate-spin text-brand" />
      <p className="type-body-sm">{label}</p>
    </div>
  );
}

/** Shown when a list/section has no data yet — compact, specific, helpful. */
export function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-center tt-anim-enter ${className}`}
    >
      <div className="w-11 h-11 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted">
        <Icon size={20} strokeWidth={1.7} />
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
        <Button variant="secondary" size="sm" onClick={action.onClick} className="mt-1">
          {action.label}
        </Button>
      )}
    </div>
  );
}

/** Shown when a section fails to load — plain language, retry when valid. */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this right now. Please try again.",
  onRetry,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className}`}
    >
      <div className="w-11 h-11 rounded-lg bg-error/10 flex items-center justify-center text-error-text">
        <AlertTriangle size={20} strokeWidth={1.7} />
      </div>
      <div>
        <p className="type-card-title text-text-primary">{title}</p>
        <p className="type-body-sm text-text-secondary mt-1 max-w-sm">{description}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-1">
          Try again
        </Button>
      )}
    </div>
  );
}
