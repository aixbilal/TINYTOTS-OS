// src/components/shell/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Package,
  Boxes,
  TrendingUp,
  ScrollText,
  LogOut,
} from "lucide-react";
import { getSession, clearSession } from "../../auth";

// Mirrors the route/role gating already defined in main.jsx's <RequireAuth adminOnly>.
const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, adminOnly: false },
  { label: "POS", to: "/pos", icon: CreditCard, adminOnly: false },
  { label: "Inventory", to: "/inventory", icon: Package, adminOnly: true },
  { label: "Low Stock", to: "/low-stock", icon: Boxes, adminOnly: true },
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

  return (
    <aside className="w-60 shrink-0 bg-maroon-800 text-cream-50 flex flex-col min-h-screen">
      <div className="px-6 py-6">
        <p className="font-display text-heading-sm text-cream-50">TinyTots OS</p>
        <p className="type-caption text-cream-50/60 mt-0.5">Retail Operations</p>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `type-nav flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-colors ${
                  isActive
                    ? "bg-maroon-700 text-cream-50"
                    : "text-cream-50/70 hover:bg-maroon-700/60 hover:text-cream-50"
                }`
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 pb-6 pt-2 border-t border-cream-50/10">
        <button
          onClick={handleLogout}
          className="type-nav w-full flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-cream-50/70 hover:bg-maroon-700/60 hover:text-cream-50 transition-colors"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
