// src/components/NotificationBell.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, AlertTriangle, CheckCircle2, Info, XCircle,
  Package, ShoppingBag, Users as UsersIcon, Server, Target,
  X, Check,
} from "lucide-react";
import { getSession } from "../auth";
import { apiFetch } from "../services/api";

const CATEGORY_ICONS = {
  inventory: Package,
  sales: ShoppingBag,
  employee: UsersIcon,
  system: Server,
  goal: Target,
};

const PRIORITY_STYLES = {
  critical: { icon: XCircle, color: "text-error-text", bg: "bg-error/10" },
  warning: { icon: AlertTriangle, color: "text-warning-text", bg: "bg-warning/10" },
  success: { icon: CheckCircle2, color: "text-success-text", bg: "bg-success/10" },
  info: { icon: Info, color: "text-info-text", bg: "bg-info/10" },
};

const POLL_INTERVAL_MS = 15000;

// Only action types the app can ACTUALLY fulfil right now (owner polish §51).
// The backend also emits `view_activity` (employee login) — there is no
// dedicated activity screen, so that notification shows with NO action button
// rather than a link that goes nowhere meaningful. `retry_sync` / `retry_printer`
// are not emitted by any current contract and are gone (they only did a full
// window reload, which is not a real retry).
const ACTION_ROUTES = {
  view_receipt: "/receipts",
  view_order: "/receipts",
  view_product: "/inventory",
  view_performance: "/performance",
};

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.round((now - date) / 60000);

  if (Number.isNaN(diffMin)) return "";
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (date.toDateString() === now.toDateString()) {
    return `${diffHr} hr ago`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const session = getSession();

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const params = new URLSearchParams({ role: session.role, username: session.username });
      const res = await fetch(`http://localhost:3000/api/notifications?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, [session]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  async function markAsRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(prev - 1, 0));
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  async function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await apiFetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: session.role, username: session.username }),
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }

  async function clearAll() {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await apiFetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: session.role, username: session.username }),
      });
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  }

  function handleAction(n) {
    const route = ACTION_ROUTES[n.action_type];
    markAsRead(n.id);
    if (route) navigate(route);
    setOpen(false);
  }

  if (!session) return null;

  const groups = [
    { key: "new", label: "New", items: notifications.filter((n) => !n.read) },
    { key: "earlier", label: "Earlier", items: notifications.filter((n) => n.read) },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="relative z-50" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative text-text-secondary hover:text-text-primary"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-brand text-pure-white type-label font-semibold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-[60] w-96 max-h-[32rem] bg-surface-panel border border-border-strong rounded-lg shadow-md flex flex-col overflow-hidden tt-anim-pop">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <h3 className="type-body-sm font-semibold text-text-primary">Notifications</h3>
            <div className="flex items-center gap-3 text-xs">
              <button onClick={markAllAsRead} className="text-text-secondary hover:text-text-primary inline-flex items-center gap-1">
                <Check size={13} /> Mark all read
              </button>
              <button onClick={clearAll} className="text-text-secondary hover:text-text-primary inline-flex items-center gap-1">
                <X size={13} /> Clear all
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <CheckCircle2 size={26} className="text-text-muted mb-3" />
                <p className="type-body-sm font-medium text-text-primary">You&apos;re all caught up</p>
                <p className="type-caption text-text-muted mt-1">New notifications will show up here.</p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.key}>
                  <p className="px-4 pt-3 pb-1 type-label uppercase tracking-wide text-text-muted">
                    {group.label}
                  </p>
                  {group.items.map((n) => {
                    const CategoryIcon = CATEGORY_ICONS[n.category] || Info;
                    const style = PRIORITY_STYLES[n.priority] || PRIORITY_STYLES.info;
                    const PriorityIcon = style.icon;
                    const hasAction = n.action_label && ACTION_ROUTES[n.action_type];

                    return (
                      <div
                        key={n.id}
                        onClick={() => !n.read && markAsRead(n.id)}
                        className={`px-4 py-3 cursor-pointer hover:bg-surface-elevated/70 transition-colors ${
                          n.read ? "" : "bg-surface-elevated/40"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                            <CategoryIcon size={15} className={style.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <PriorityIcon size={12} className={style.color} />
                              <p className="type-body-sm font-medium text-text-primary truncate">{n.title}</p>
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />}
                            </div>
                            <p className="type-caption text-text-secondary mt-0.5">{n.description}</p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="type-tiny text-text-muted">{timeAgo(n.created_at)}</span>
                              {hasAction && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction(n);
                                  }}
                                  className="type-tiny font-medium text-brand hover:underline"
                                >
                                  {n.action_label}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
