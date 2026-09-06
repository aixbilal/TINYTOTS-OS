// src/components/shell/PageContainer.jsx

/**
 * Standard content container used by every screen mounted inside AppShell.
 * Establishes consistent outer padding/scroll behavior so screens don't
 * each invent their own page margins.
 *
 * `dense` trades the standard padding for a tighter one, for viewport-
 * hungry operational screens (e.g. POS) that need to preserve usable
 * screen space rather than follow the default content-page rhythm.
 */
export default function PageContainer({ className = "", dense = false, children }) {
  const padding = dense ? "px-4 py-4 md:px-6 md:py-6" : "px-6 py-6 md:px-10 md:py-8";
  return (
    <main className={`flex-1 min-w-0 overflow-y-auto ${padding} ${className}`}>
      {children}
    </main>
  );
}
