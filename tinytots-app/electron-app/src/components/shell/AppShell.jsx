// src/components/shell/AppShell.jsx
import Sidebar from "./Sidebar";
import Header from "../Header";
import PageContainer from "./PageContainer";

/**
 * Persistent application shell: fixed inverse sidebar + slim top bar, wrapping
 * a screen's content in the shared PageContainer. The frame owns the only
 * full-height layout; the content region is the single scroll container.
 *
 * The warm TinyTots palette is the canonical default now (see index.css /
 * DESIGN.md §2), so the workspace column needs no palette opt-in — only the
 * sidebar carries the explicit `.tt-inverse` scope.
 *
 * `dense` forwards to PageContainer for viewport-hungry operational screens
 * (e.g. POS) that need tighter outer padding.
 */
export default function AppShell({ children, dense = false }) {
  return (
    <div className="h-screen flex overflow-hidden bg-surface-app text-text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <PageContainer dense={dense}>{children}</PageContainer>
      </div>
    </div>
  );
}
