// src/components/ui/Dialog.jsx
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Shared modal dialog (DESIGN.md §11 Dialog). White panel, radius-xl, strong
 * hairline, warm --shadow-lg over a warm scrim. Enters with a short fade + rise.
 * Escape closes; focus moves in on open and is restored to the trigger on close;
 * Tab is trapped within the panel.
 */
export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement;

    // Move focus into the dialog.
    const panel = panelRef.current;
    const focusables = () =>
      panel?.querySelectorAll(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
      ) ?? [];
    (focusables()[0] || panel)?.focus();

    function handleKey(e) {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key === "Tab") {
        const nodes = Array.from(focusables());
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxW = size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-sm" : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-surface-overlay backdrop-blur-[2px] tt-anim-fade"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative w-full ${maxW} rounded-xl bg-surface-panel p-6 border border-border-strong shadow-lg outline-none tt-anim-dialog`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && <h2 className="type-heading-sm text-text-primary">{title}</h2>}
            {description && (
              <p className="type-body-sm text-text-secondary mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary rounded-md p-1 hover:bg-surface-elevated transition-colors"
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
