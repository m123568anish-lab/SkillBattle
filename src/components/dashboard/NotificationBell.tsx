"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import api from "@/services/api";

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      setNotifs(res.data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Poll every 30s
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // fail silently
    }
  };

  const typeIcon = (type: string) => {
    const icons: Record<string, string> = {
      battle: "⚔️",
      xp: "⚡",
      achievement: "🏅",
      system: "🔔",
    };
    return icons[type] || "🔔";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-lg shadow-rose-500/40">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="font-bold text-white text-sm">Notifications</span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
              {notifs.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">
                  <Bell className="mx-auto h-8 w-8 mb-2 opacity-30" />
                  No notifications yet
                </div>
              ) : (
                notifs.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 transition hover:bg-white/5 ${!n.is_read ? "bg-violet-500/5" : ""}`}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{typeIcon(n.notification_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${!n.is_read ? "text-white" : "text-slate-400"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    {!n.is_read && (
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-violet-500 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
