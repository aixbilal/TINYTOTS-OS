// src/components/NotificationBell.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, CheckCircle2, Info,
  Package, ShoppingBag, Users as UsersIcon, Server, Target,
  X, Check,
} from "lucide-react";
import { getSession } from "../auth";
import { apiFetch } from "../services/api";
import { timeAgo } from "../lib/time";

const CATEGORY_ICONS = {
  inventory: Package,
  sales: ShoppingBag,
  employee: UsersIcon,
  system: Server,
  goal: Target,
};

// Low-saturation semantic icon well per priority (colour + tint only).
const PRIORITY_STYLES = {
  critical: { color: "text-error-text", bg: "bg-error/12" },
  warning: { color: "text-warning-text", bg: "bg-warning/14" },
  success: { color: "text-success-text", bg: "bg-success/12" },
  info: { color: "text-info-text", bg: "bg-info/12" },
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
        className="relative text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-brand text-pure-white type-label font-semibold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-[60] w-[380px] max-h-[34rem] bg-surface-panel border border-border-default rounded-xl shadow-lg flex flex-col overflow-hidden tt-anim-pop">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-default">
            <h3 className="type-card-title text-text-primary">Notifications</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={markAllAsRead}
                className="type-caption text-text-secondary hover:text-brand inline-flex items-center gap-1 transition-colors"
              >
                <Check size={13} /> Mark all read
              </button>
              <button
                onClick={clearAll}
                className="type-caption text-text-secondary hover:text-brand inline-flex items-center gap-1 transition-colors"
              >
                <X size={13} /> Clear all
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <span className="w-11 h-11 rounded-full bg-success/12 text-success-text flex items-center justify-center mb-3">
                  <CheckCircle2 size={20} />
                </span>
                <p className="type-body-sm font-medium text-text-primary">You&apos;re all caught up</p>
                <p className="type-caption text-text-muted mt-1">New notifications will show up here.</p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.key}>
                  <p className="sticky top-0 z-10 px-4 pt-3.5 pb-1.5 type-tiny font-semibold uppercase tracking-[0.08em] text-text-muted bg-surface-panel">
                    {group.label}
                  </p>
                  <div className="divide-y divide-border-default/40">
                    {group.items.map((n) => {
                      const CategoryIcon = CATEGORY_ICONS[n.category] || Info;
                      const style = PRIORITY_STYLES[n.priority] || PRIORITY_STYLES.info;
                      const hasAction = n.action_label && ACTION_ROUTES[n.action_type];

                      return (
                        <div
                          key={n.id}
                          onClick={() => !n.read && markAsRead(n.id)}
                          className={`relative px-4 py-3 transition-colors ${
                            n.read
                              ? "hover:bg-surface-elevated/50"
                              : "bg-brand/[0.045] cursor-pointer hover:bg-brand/[0.07]"
                          }`}
                        >
                          {!n.read && (
                            <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-brand" />
                          )}
                          <div className="flex gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}
                            >
                              <CategoryIcon size={16} strokeWidth={1.9} className={style.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p
                                  className={`type-body-sm truncate ${
                                    n.read
                                      ? "font-medium text-text-secondary"
                                      : "font-semibold text-text-primary"
                                  }`}
                                >
                                  {n.title}
                                </p>
                                {!n.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                                )}
                              </div>
                              {n.description && (
                                <p className="type-caption text-text-secondary mt-0.5 line-clamp-2">
                                  {n.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between gap-3 mt-1.5">
                                <span className="type-tiny text-text-muted tabular-nums">
                                  {timeAgo(n.created_at)}
                                </span>
                                {hasAction && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAction(n);
                                    }}
                                    className="type-tiny font-semibold text-brand hover:underline"
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
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
