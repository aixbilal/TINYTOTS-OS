// src/components/shell/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  ScrollText,
  LogOut,
  Shirt,
} from "lucide-react";
import { getSession, clearSession } from "../../auth";

// Mirrors the route/role gating already defined in main.jsx's <RequireAuth adminOnly>.
// Only routes that actually exist in the app are listed — the reference sheets
// show more nav entries (Products, Orders, Customers, Reports, Settings …) but
// those screens don't exist yet, so they are deliberately omitted here.
const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, adminOnly: false },
  { label: "POS", to: "/pos", icon: ShoppingCart, adminOnly: false },
  { label: "Inventory", to: "/inventory", icon: Package, adminOnly: true },
  { label: "Low Stock", to: "/low-stock", icon: AlertTriangle, adminOnly: true },
  { label: "Performance", to: "/performance", icon: TrendingUp, adminOnly: true },
  { label: "Receipts", to: "/receipts", icon: ScrollText, adminOnly: true },
];

export default function Sidebar() {
  const session = getSession();
  const isAdmin = session?.role === "admin";
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  const initial = session?.name?.[0]?.toUpperCase() || "?";

  return (
    <aside className="tt-sidebar w-56 shrink-0 bg-surface-sidebar border-r border-border-default flex flex-col h-screen">
      {/* Brand */}
      <div className="px-5 h-14 flex items-center gap-2.5 border-b border-border-default">
        <span className="w-7 h-7 rounded-lg bg-brand/15 text-brand flex items-center justify-center shrink-0">
          <Shirt size={16} strokeWidth={2} />
        </span>
        <span className="text-[17px] font-bold tracking-tight text-text-primary leading-none">
          TinyTots<span className="text-brand"> OS</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `type-nav relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                  isActive
                    ? "bg-surface-elevated text-text-primary"
                    : "text-text-secondary hover:bg-surface-elevated/60 hover:text-text-primary"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand" />
                  )}
                  <Icon
                    size={17}
                    strokeWidth={1.9}
                    className={isActive ? "text-brand" : ""}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-border-default p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <span className="w-8 h-8 rounded-full bg-brand text-pure-white text-[13px] font-semibold flex items-center justify-center shrink-0">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="type-body-sm font-medium text-text-primary truncate">
              {session?.name || "Guest"}
            </p>
            <p className="type-caption text-text-muted capitalize truncate">
              {session?.role || "—"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="type-nav mt-1 w-full flex items-center gap-3 rounded-lg px-3 py-2 text-text-secondary hover:bg-surface-elevated/60 hover:text-text-primary transition-colors"
        >
          <LogOut size={17} strokeWidth={1.9} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
