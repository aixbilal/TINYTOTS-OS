// src/components/shell/AppShell.jsx
import Sidebar from "./Sidebar";
import Header from "../Header";
import PageContainer from "./PageContainer";

/**
 * Persistent application shell: sidebar navigation + header, wrapping a
 * screen's content in the shared PageContainer. Reuses the existing Header
 * component (profile menu, notifications, greeting) unmodified rather than
 * rebuilding that logic.
 *
 * `dense` forwards to PageContainer for operational screens (e.g. POS) that
 * need tighter outer padding to preserve usable viewport space.
 */
export default function AppShell({ children, dense = false }) {
  return (
    <div className="min-h-screen flex bg-cream">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 pt-6 md:px-10">
          <Header />
        </div>
        <PageContainer dense={dense}>{children}</PageContainer>
      </div>
    </div>
  );
}
