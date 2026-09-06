// src/components/shell/PageContainer.jsx

/**
 * Standard content container used by every screen mounted inside AppShell.
 * Establishes consistent outer padding/scroll behavior so screens don't
 * each invent their own page margins.
 */
export default function PageContainer({ className = "", children }) {
  return (
    <main className={`flex-1 min-w-0 overflow-y-auto px-6 py-6 md:px-10 md:py-8 ${className}`}>
      {children}
    </main>
  );
}
