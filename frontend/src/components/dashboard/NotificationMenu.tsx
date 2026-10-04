"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bell, CheckCheck, X } from "lucide-react";
import api from "@/services/api";

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
        className="relative rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-cyan-400"
      >
        <Bell className="text-white" size={22} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <section
            aria-label="Notifications"
            className="absolute right-0 top-14 z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-bold text-white">
                Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
              </span>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-slate-400 transition hover:text-white"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> All read
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Close notifications"
                  onClick={() => setOpen(false)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {error && (
              <div role="alert" className="flex items-center justify-between gap-3 border-b border-rose-400/20 px-4 py-2 text-xs text-rose-200">
                <span>{error}</span>
                <button type="button" onClick={() => setRefreshToken((value) => value + 1)} className="shrink-0 underline">
                  Retry
                </button>
              </div>
            )}

            <div className="max-h-80 divide-y divide-white/5 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">Loading notifications…</p>
              ) : notifs.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
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
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5 ${notification.is_read ? "" : "bg-cyan-400/5"}`}
                    >
                      <span aria-hidden="true" className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm text-cyan-200">
                        {typeIcon(notification.notification_type)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-semibold ${notification.is_read ? "text-slate-300" : "text-white"}`}>
                          {notification.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-slate-400">
                          {notification.message}
                        </span>
                        <time className="mt-1 block text-[11px] text-slate-500" dateTime={notification.created_at}>
                          {new Date(notification.created_at).toLocaleString()}
                        </time>
                      </span>
                      {destination && <ArrowUpRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-slate-500" />}
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}