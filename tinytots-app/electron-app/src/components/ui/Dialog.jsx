// src/components/ui/Dialog.jsx
import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Shared modal dialog primitive for the dark system: a solid elevated panel
 * over a dark scrim. Sits above cards in elevation so it gets a slightly
 * larger radius and a strong border.
 */
export default function Dialog({ open, onClose, title, description, children, footer }) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-surface-overlay backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-surface-panel p-6 border border-border-strong shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)]">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && <h2 className="type-heading-sm text-text-primary">{title}</h2>}
            {description && (
              <p className="type-body-sm text-text-secondary mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary rounded-lg p-1 hover:bg-surface-elevated transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div>{children}</div>

        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
