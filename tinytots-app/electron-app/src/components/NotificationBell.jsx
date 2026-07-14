// src/components/NotificationBell.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, AlertTriangle, CheckCircle2, Info, XCircle,
  Package, ShoppingBag, Users as UsersIcon, Server, Target,
  X, Check,
} from "lucide-react";
import { getSession } from "../auth";

const CATEGORY_ICONS = {
  inventory: Package,
  sales: ShoppingBag,
  employee: UsersIcon,
  system: Server,
  goal: Target,
};

const PRIORITY_STYLES = {
  critical: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  success: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
};

const POLL_INTERVAL_MS = 15000;

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;

  return `Today ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAsRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(prev - 1, 0));
    try {
      await fetch(`http://localhost:3000/api/notifications/${id}/read`, { method: "PATCH" });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  async function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch("http://localhost:3000/api/notifications/mark-all-read", {
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
      await fetch("http://localhost:3000/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: session.role, username: session.username }),
      });
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  }

  function handleAction(n) {
    markAsRead(n.id);
    switch (n.action_type) {
      case "view_receipt":
        navigate("/receipts");
        break;
      case "view_product":
        navigate("/inventory");
        break;
      case "view_activity":
        // Placeholder until a dedicated employee-activity log screen exists
        navigate("/dashboard");
        break;
      case "view_report":
        navigate("/performance");
        break;
      case "retry_sync":
      case "retry_printer":
        // Hook these up to your actual retry logic where available
        window.location.reload();
        break;
      default:
        break;
    }
    setOpen(false);
  }

  if (!session) return null;

  return (
    <div className="relative z-50" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative text-ink-900 hover:text-maroon-700"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-maroon-700 text-cream-50 text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
    <div className="absolute right-0 top-9 z-[60] w-96 max-h-[32rem] bg-white border border-gold-300/40 rounded-2xl shadow-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold-300/30">
            <h3 className="font-medium text-ink-900">Notifications</h3>
            <div className="flex items-center gap-3 text-xs">
              <button onClick={markAllAsRead} className="text-ink-700 hover:text-maroon-700 inline-flex items-center gap-1">
                <Check size={13} /> Mark all read
              </button>
              <button onClick={clearAll} className="text-ink-700 hover:text-maroon-700 inline-flex items-center gap-1">
                <X size={13} /> Clear all
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <CheckCircle2 size={28} className="text-ink-700/30 mb-3" />
                <p className="text-sm font-medium text-ink-900">You're all caught up!</p>
                <p className="text-xs text-ink-700/60 mt-1">No new notifications at the moment.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const CategoryIcon = CATEGORY_ICONS[n.category] || Info;
                const style = PRIORITY_STYLES[n.priority] || PRIORITY_STYLES.info;
                const PriorityIcon = style.icon;

                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markAsRead(n.id)}
                    className={`px-4 py-3 border-b border-cream-100 last:border-0 cursor-pointer hover:bg-cream-100 ${
                      n.read ? "" : "bg-cream-50"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                        <CategoryIcon size={15} className={style.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <PriorityIcon size={12} className={style.color} />
                          <p className="text-sm font-medium text-ink-900 truncate">{n.title}</p>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-maroon-700 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-ink-700 mt-0.5">{n.description}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[11px] text-ink-700/50">{timeAgo(n.created_at)}</span>
                          {n.action_label && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(n);
                              }}
                              className="text-[11px] font-medium text-maroon-700 hover:underline"
                            >
                              {n.action_label}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <button
              onClick={() => setOpen(false)}
              className="text-center text-xs text-ink-700 hover:text-maroon-700 py-2.5 border-t border-gold-300/30"
            >
              View all notifications
            </button>
          )}
        </div>
      )}
    </div>
  );
}