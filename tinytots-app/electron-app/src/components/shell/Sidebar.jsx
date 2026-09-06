// src/components/shell/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  ScrollText,
  Users,
  Printer,
  LogOut,
  Shirt,
} from "lucide-react";
import { getSession, clearSession } from "../../auth";

// Physical-store V1 primary navigation (owner polish §9). Categories, Reports
// and Customers are intentionally NOT listed — their routes/code stay live for
// future work (main.jsx), they're just not primary destinations yet. Only
// routes that actually exist appear here — no Audit Logs / Sessions / Security
// / Backup / Import-Export placeholders (DESIGN.md §12).
const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, adminOnly: false },
  { label: "POS", to: "/pos", icon: ShoppingCart, adminOnly: false },
  { label: "Inventory", to: "/inventory", icon: Package, adminOnly: true },
  { label: "Low Stock", to: "/low-stock", icon: AlertTriangle, adminOnly: true },
  { label: "Performance", to: "/performance", icon: TrendingUp, adminOnly: true },
  { label: "Receipts", to: "/receipts", icon: ScrollText, adminOnly: true },
  { label: "Staff", to: "/users", icon: Users, adminOnly: true },
  { label: "Printer", to: "/settings/printer", icon: Printer, adminOnly: true },
];

const navRow = (isActive) =>
  `type-nav relative flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
    isActive
      ? "bg-surface-elevated text-text-primary"
      : "text-text-secondary hover:bg-surface-elevated/60 hover:text-text-primary"
  }`;

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
    <aside className="tt-inverse tt-sidebar w-56 shrink-0 bg-surface-sidebar flex flex-col h-screen">
      {/* Brand — compact, restrained */}
      <div className="px-5 h-14 flex items-center gap-2 shrink-0">
        <Shirt size={17} strokeWidth={2} className="text-brand shrink-0" />
        <span className="type-nav font-bold tracking-tight text-text-primary leading-none">
          TinyTots<span className="text-text-muted font-semibold"> OS</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => navRow(isActive)}>
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
      <div className="p-3 pt-2 mt-auto border-t border-border-default">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors ${
              isActive ? "bg-surface-elevated" : "hover:bg-surface-elevated/60"
            }`
          }
        >
          <span className="w-8 h-8 rounded-full bg-brand text-pure-white type-label font-semibold flex items-center justify-center shrink-0">
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
        </NavLink>
        <button
          onClick={handleLogout}
          className="type-nav mt-0.5 w-full flex items-center gap-3 rounded-md px-3 py-2 text-text-secondary hover:bg-surface-elevated/60 hover:text-text-primary transition-colors"
        >
          <LogOut size={17} strokeWidth={1.9} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
