// src/components/header.jsx
import NotificationBell from "./NotificationBell";

/**
 * Slim persistent utility bar inside the AppShell.
 *
 * Profile identity lives ONLY in the sidebar now (owner polish §17) — the old
 * duplicate header profile menu (and its "Manage Employees" shortcut, which
 * duplicated the Staff & Access page) has been removed. The screen owns its own
 * title/greeting; the shell keeps just the global notifications affordance.
 */
export default function Header() {
  return (
    <header className="h-14 shrink-0 border-b border-border-default bg-surface-app flex items-center justify-end px-4 md:px-6">
      <NotificationBell />
    </header>
  );
}
