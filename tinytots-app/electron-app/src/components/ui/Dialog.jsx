// src/components/ui/Dialog.jsx
import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Shared modal dialog primitive. Uses a larger radius (rounded-3xl) than
 * Card (rounded-2xl) per the redesign docs' radius hierarchy — dialogs sit
 * above cards in elevation, so they get a slightly larger corner treatment.
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
        className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-lg border border-gold-300/30">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && <h2 className="type-heading-sm text-ink-900">{title}</h2>}
            {description && (
              <p className="type-body-sm text-ink-700/70 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-ink-700/60 hover:text-ink-900 rounded-full p-1 hover:bg-cream-100"
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
