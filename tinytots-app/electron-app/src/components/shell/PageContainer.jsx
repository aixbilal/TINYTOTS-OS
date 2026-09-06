// src/components/shell/PageContainer.jsx

/**
 * Standard content container used by every screen mounted inside AppShell.
 * This is the single scroll region of the app frame, so screens don't each
 * invent their own page margins or full-height wrappers.
 *
 * `dense` trades the standard padding for a tighter one, for viewport-
 * hungry operational screens (e.g. POS).
 */
export default function PageContainer({ className = "", dense = false, children }) {
  const padding = dense ? "p-4 md:p-5" : "p-5 md:p-7";
  return (
    <main className={`flex-1 min-h-0 min-w-0 overflow-y-auto ${padding} ${className}`}>
      {children}
    </main>
  );
}
