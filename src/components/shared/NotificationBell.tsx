import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, FileText, Code2, Calculator, Mic, Sparkles, User, TrendingUp,
  Trash2, CheckCheck, X, BellOff,
} from "lucide-react";
import { auth } from "../../lib/firebase";
import {
  useNotificationStore, type AppNotification, type NotificationType,
} from "../../store/useNotificationStore";
import {
  markNotificationRead, deleteNotification, markAllNotificationsRead, clearAllNotifications,
} from "../../lib/notificationService";
// =====================================================================
// components/shared/NotificationBell.tsx
// Real notification bell + panel. Grouped by Today / Yesterday / Earlier.
// =====================================================================

const TYPE_ICON: Record<NotificationType, typeof FileText> = {
  resume: FileText,
  coding: Code2,
  aptitude: Calculator,
  interview: Mic,
  recommendation: Sparkles,
  profile: User,
  weeklyReport: TrendingUp,
};

function groupNotifications(notifications: AppNotification[]) {
  const today: AppNotification[] = [];
  const yesterday: AppNotification[] = [];
  const earlier: AppNotification[] = [];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  notifications.forEach((n) => {
    const date = n.createdAt?.toDate();
    if (!date) {
      earlier.push(n);
      return;
    }
    if (date >= startOfToday) today.push(n);
    else if (date >= startOfYesterday) yesterday.push(n);
    else earlier.push(n);
  });

  return { today, yesterday, earlier };
}

export function NotificationBell() {
  const notifications = useNotificationStore((s) => s.notifications);
  const isPanelOpen = useNotificationStore((s) => s.isPanelOpen);
  const togglePanel = useNotificationStore((s) => s.togglePanel);
  const closePanel = useNotificationStore((s) => s.closePanel);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const { today, yesterday, earlier } = groupNotifications(notifications);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) closePanel();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closePanel]);

  async function handleItemClick(n: AppNotification) {
    const uid = auth.currentUser?.uid;
    if (uid && !n.read) await markNotificationRead(uid, n.id);
    if (n.link) {
      navigate(n.link);
      closePanel();
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const uid = auth.currentUser?.uid;
    if (uid) await deleteNotification(uid, id);
  }

  async function handleMarkAllRead() {
    const uid = auth.currentUser?.uid;
    if (uid) await markAllNotificationsRead(uid);
  }

  async function handleClearAll() {
    const uid = auth.currentUser?.uid;
    if (uid) await clearAllNotifications(uid);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={togglePanel}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-graytext transition-colors hover:bg-white/5 hover:text-ink"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-[0_0_6px_rgba(229,9,20,0.8)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-[92vw] max-w-sm rounded-2xl border border-border bg-surface/95 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-ink">Notifications</h3>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
                <button onClick={closePanel} className="text-graytext hover:text-ink">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <BellOff className="h-6 w-6 text-graytext" />
                  <p className="text-sm text-graytext">No notifications yet</p>
                </div>
              ) : (
                <>
                  <NotificationGroup label="Today" items={today} onItemClick={handleItemClick} onDelete={handleDelete} />
                  <NotificationGroup label="Yesterday" items={yesterday} onItemClick={handleItemClick} onDelete={handleDelete} />
                  <NotificationGroup label="Earlier" items={earlier} onItemClick={handleItemClick} onDelete={handleDelete} />
                </>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-border px-4 py-2.5">
                <button
                  onClick={handleClearAll}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-graytext hover:bg-white/5 hover:text-primary"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function NotificationGroup({
  label,
  items,
  onItemClick,
  onDelete,
}: {
  label: string;
  items: AppNotification[];
  onItemClick: (n: AppNotification) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-graytext">
        {label}
      </p>

      <ul>
        {items.map((n) => {
          const Icon = TYPE_ICON[n.type] ?? Bell;

          return (
            <li key={n.id} className="group relative flex items-start">
              <button
                onClick={() => onItemClick(n)}
                className={`flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                  !n.read ? "bg-primary/[0.04]" : ""
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                    !n.read
                      ? "border-primary/30 bg-primary/15"
                      : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      !n.read ? "text-primary" : "text-graytext"
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${
                        !n.read
                          ? "font-semibold text-ink"
                          : "font-medium text-graydark"
                      }`}
                    >
                      {n.title}
                    </p>

                    {!n.read && (
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>

                  <p className="mt-0.5 text-xs text-graytext line-clamp-2">
                    {n.message}
                  </p>

                  <p className="mt-1 text-[10px] text-graytext/70">
                    {n.createdAt?.toDate().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={(e) => onDelete(e, n.id)}
                className="mt-3 mr-3 shrink-0 text-graytext opacity-100 transition-colors hover:text-primary sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                aria-label="Delete notification"
                title="Delete notification"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
