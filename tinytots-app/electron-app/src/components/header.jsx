// src/components/header.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Users, ChevronDown } from "lucide-react";
import { getSession, clearSession } from "../auth";
import NotificationBell from "./NotificationBell";
import EmployeesModal from "./EmployeesModal";

/**
 * Slim persistent top bar inside the AppShell. Notifications + profile menu.
 * The greeting/date now lives in each screen's own header region, matching
 * the reference dashboard composition.
 */
export default function Header() {
  const session = getSession();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [employeesOpen, setEmployeesOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  const initial = session?.name?.[0]?.toUpperCase() || "?";
  const isAdmin = session?.role === "admin";

  return (
    <>
      <header className="h-14 shrink-0 border-b border-border-default bg-surface-app flex items-center justify-end gap-2 px-4 md:px-6">
        <NotificationBell />

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-surface-elevated transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-brand text-pure-white text-[13px] font-semibold flex items-center justify-center">
              {initial}
            </span>
            <span className="hidden sm:block text-left leading-tight">
              <span className="block type-body-sm font-medium text-text-primary">
                {session?.name || "Guest"}
              </span>
              <span className="block type-caption text-text-muted capitalize">
                {session?.role || "—"}
              </span>
            </span>
            <ChevronDown size={14} className="text-text-muted" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 z-[60] w-56 bg-surface-panel border border-border-strong rounded-xl shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
              <div className="px-4 py-3 border-b border-border-default">
                <p className="type-body-sm font-medium text-text-primary">
                  {session?.name}
                </p>
                <p className="type-caption text-text-muted capitalize">
                  {session?.role} · @{session?.username}
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    setEmployeesOpen(true);
                    setProfileOpen(false);
                  }}
                  className="type-body-sm w-full text-left px-4 py-2.5 text-text-primary hover:bg-surface-elevated inline-flex items-center gap-2"
                >
                  <Users size={14} /> Manage Employees
                </button>
              )}

              <button
                onClick={handleLogout}
                className="type-body-sm w-full text-left px-4 py-2.5 text-brand hover:bg-surface-elevated inline-flex items-center gap-2"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      {employeesOpen && <EmployeesModal onClose={() => setEmployeesOpen(false)} />}
    </>
  );
}
