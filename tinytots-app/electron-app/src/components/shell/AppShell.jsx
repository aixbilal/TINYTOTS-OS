// src/components/shell/AppShell.jsx
import Sidebar from "./Sidebar";
import Header from "../Header";
import PageContainer from "./PageContainer";

/**
 * Persistent application shell: sidebar navigation + header, wrapping a
 * screen's content in the shared PageContainer. Reuses the existing Header
 * component (profile menu, notifications, greeting) unmodified rather than
 * rebuilding that logic.
 */
export default function AppShell({ children }) {
  return (
    <div className="min-h-screen flex bg-cream">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 pt-6 md:px-10">
          <Header />
        </div>
        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  );
}
