// src/components/shell/AppShell.jsx
import Sidebar from "./Sidebar";
import Header from "../Header";
import PageContainer from "./PageContainer";

/**
 * Persistent application shell: fixed sidebar + slim top bar, wrapping a
 * screen's content in the shared PageContainer. The frame owns the only
 * full-height layout; the content region is the single scroll container.
 *
 * `dense` forwards to PageContainer for viewport-hungry operational screens
 * (e.g. POS) that need tighter outer padding.
 *
 * `warm` opts the workspace column (Header + content) into the TinyTots
 * brand palette (`.tt-warm`): warm ivory canvas, white cards, olive
 * primary. Screens still on the dark reference system leave it off until
 * their own controlled palette pass.
 */
export default function AppShell({ children, dense = false, warm = false }) {
  return (
    <div className="h-screen flex overflow-hidden bg-surface-app text-text-primary">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          warm ? "tt-warm bg-surface-app text-text-primary" : ""
        }`}
      >
        <Header />
        <PageContainer dense={dense}>{children}</PageContainer>
      </div>
    </div>
  );
}
