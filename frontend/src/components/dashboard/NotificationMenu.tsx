"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bell, CheckCheck } from "lucide-react";
import api from "@/services/api";
import HeaderPanel from "./HeaderPanel";

type NotificationItem = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
};

export default function NotificationMenu() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchNotifications = async () => {
      try {
        if (open) setLoading(true);
        const countResponse = await api.get<{ unread_count: number }>("/notifications/unread-count");
        if (!active) return;
        setUnreadCount(countResponse.data.unread_count);
        if (open) {
          const notificationResponse = await api.get<NotificationItem[]>("/notifications", { params: { limit: 30 } });
          if (!active) return;
          setNotifs(notificationResponse.data);
        }
        setError(null);
      } catch {
        if (active) setError("Notifications could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchNotifications();
    const interval = open ? setInterval(() => void fetchNotifications(), 30000) : undefined;
    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [open, refreshToken]);

  const markRead = async (notification: NotificationItem) => {
    if (notification.is_read) return;
    try {
      await api.put(`/notifications/${encodeURIComponent(notification.id)}/read`);
      setNotifs((previous) => previous.map((item) => (
        item.id === notification.id ? { ...item, is_read: true } : item
      )));
      setUnreadCount((count) => Math.max(0, count - 1));
      setError(null);
    } catch {
      setError("This notification could not be marked as read.");
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifs((previous) => previous.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
      setError(null);
    } catch {
      setError("Notifications could not be marked as read.");
    }
  };

  const destinationFor = (notification: NotificationItem): string | null => {
    const relatedId = notification.related_entity_id;
    if (notification.related_entity_type === "battle" && relatedId) {
      return `/battle/${encodeURIComponent(relatedId)}`;
    }
    if (notification.related_entity_type === "application") {
      return "/dashboard";
    }
    return null;
  };

  const openNotification = async (notification: NotificationItem) => {
    await markRead(notification);
    const destination = destinationFor(notification);
    if (destination) {
      setOpen(false);
      router.push(destination);
    }
  };

  const typeIcon = (type: string) => {
    const icons: Record<string, string> = {
      application: "▣",
      assessment: "✓",
      battle: "⚔",
      xp: "⚡",
      achievement: "◇",
      system: "•",
    };
    return icons[type] || "•";
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="dialog"
        className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] transition hover:border-[var(--accent)]/60 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] max-[359px]:h-9 max-[359px]:w-9 sm:h-10 sm:w-10"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <HeaderPanel
        open={open}
        title={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
        onClose={() => setOpen(false)}
        mobilePresentation="popover"
        actions={unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          >
            <CheckCheck className="h-3.5 w-3.5" /> All read
          </button>
        ) : undefined}
      >
            {error && (
              <div role="alert" className="flex items-center justify-between gap-3 border-b border-[var(--status-danger)]/20 px-4 py-2 text-xs text-[var(--status-danger)]">
                <span>{error}</span>
                <button type="button" onClick={() => setRefreshToken((value) => value + 1)} className="shrink-0 underline">
                  Retry
                </button>
              </div>
            )}

            <div className="divide-y divide-[var(--border-subtle)]">
              {loading ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Loading notifications…</p>
              ) : notifs.length === 0 ? (
                <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                  <Bell className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  No notifications yet
                </div>
              ) : (
                notifs.map((notification) => {
                  const destination = destinationFor(notification);
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => void openNotification(notification)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[var(--surface-card)] ${notification.is_read ? "" : "bg-[var(--accent)]/5"}`}
                    >
                      <span aria-hidden="true" className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-card)] text-sm text-[var(--accent-strong)]">
                        {typeIcon(notification.notification_type)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-semibold ${notification.is_read ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
                          {notification.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-[var(--text-muted)]">
                          {notification.message}
                        </span>
                        <time className="mt-1 block text-[11px] text-[var(--text-muted)]" dateTime={notification.created_at}>
                          {new Date(notification.created_at).toLocaleString()}
                        </time>
                      </span>
                      {destination && <ArrowUpRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[var(--text-muted)]" />}
                    </button>
                  );
                })
              )}
            </div>
      </HeaderPanel>
    </div>
  );
}