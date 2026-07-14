// src/components/Header.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Users } from "lucide-react";
import { getSession, clearSession } from "../auth";
import NotificationBell from "./NotificationBell";
import EmployeesModal from "./EmployeesModal";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

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
     <div
        className="relative z-50 flex items-center justify-end gap-4 rounded-2xl px-6 py-4 border border-white/40 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.10) 100%)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
        }}
      >
        <div className="text-right hidden sm:block">
          <p className="text-xs text-ink-800/80">{getGreeting()},</p>
          <p className="font-semibold text-maroon-700">{session?.name || "Guest"}</p>
        </div>

        <NotificationBell />

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="w-9 h-9 rounded-full bg-maroon-700 text-cream-50 flex items-center justify-center font-semibold text-sm"
          >
            {initial}
          </button>

          {profileOpen && (
         <div className="absolute right-0 top-11 z-[60] w-56 bg-white border border-gold-300/40 rounded-xl shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gold-300/30">
                <p className="text-sm font-medium text-ink-900">{session?.name}</p>
                <p className="text-xs text-ink-700/60 capitalize">
                  {session?.role} · @{session?.username}
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    setEmployeesOpen(true);
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-ink-900 hover:bg-cream-100 inline-flex items-center gap-2"
                >
                  <Users size={14} /> Manage Employees
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-maroon-700 hover:bg-cream-100 inline-flex items-center gap-2"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {employeesOpen && <EmployeesModal onClose={() => setEmployeesOpen(false)} />}
    </>
  );
}