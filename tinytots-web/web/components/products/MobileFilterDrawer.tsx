"use client";

import { useEffect, useRef } from "react";

/**
 * Off-canvas mobile filter drawer for the storefront products page.
 *
 * Desktop/tablet (>= md) keeps the inline sidebar in ProductsBrowser untouched;
 * this drawer is only mounted/shown below the md breakpoint. Filter state lives
 * in ProductsBrowser and is passed straight through as `children`, so opening or
 * closing the drawer never resets a selection.
 *
 * Behaviour: slides from the right (~88vw, max 360px), full 100dvh, dimmed
 * backdrop with the page still visible behind it, body scroll locked while open,
 * backdrop-tap / X / Escape all close, focus is trapped inside and restored to
 * the trigger on close, and the transition is skipped under
 * prefers-reduced-motion.
 */
export default function MobileFilterDrawer({
  open,
  onClose,
  resultCount,
  onClear,
  children,
}: {
  open: boolean;
  onClose: () => void;
  resultCount: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Body scroll lock while the drawer is open. Restores the previous value so
  // it composes safely with any other lock (e.g. a modal opened underneath).
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Focus management: remember the trigger, move focus into the drawer, trap
  // Tab within it, and restore focus on close.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    // Defer so the element is actually visible/focusable after the mount.
    const raf = requestAnimationFrame(() => closeButtonRef.current?.focus());

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <div className="md:hidden" aria-hidden={!open}>
      {/* Backdrop — page stays visible behind it. */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-200 motion-reduce:transition-none ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Product filters"
        className={`fixed right-0 top-0 z-[70] flex h-[100dvh] w-[88vw] max-w-[360px] flex-col bg-surface-elevated shadow-xl transition-transform duration-200 ease-out motion-reduce:transition-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3.5">
          <h2 className="font-label-lg text-label-lg font-semibold uppercase tracking-wider text-text-primary">
            Filters
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
          {children}
        </div>

        <div className="sticky bottom-0 flex items-center gap-3 border-t border-border-default bg-surface-elevated px-4 py-3">
          <button
            type="button"
            onClick={onClear}
            className="font-body-sm text-body-sm text-brand-primary hover:underline"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-full bg-brand-primary px-6 py-2.5 font-button text-button text-white transition-opacity hover:opacity-90"
          >
            Show {resultCount} {resultCount === 1 ? "Product" : "Products"}
          </button>
        </div>
      </div>
    </div>
  );
}
