"use client";

import { useEffect, useState } from "react";
import { Moon, Search, Sun, Trophy } from "lucide-react";
import NotificationMenu from "./NotificationMenu";
import ProfileMenu from "./ProfileMenu";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";

interface TopNavbarProps {
  onMenuClick?: () => void;
}

export default function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const user = useAuthStore((s) => s.user);
  const dashboard = useDashboardStore((s) => s.dashboard);
  const [lightMode, setLightMode] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("skillbattle-theme");
    const enabled = savedTheme === "light";
    setLightMode(enabled);
    document.documentElement.dataset.theme = enabled ? "light" : "dark";
  }, []);

  function toggleTheme() {
    setLightMode((enabled) => {
      const next = !enabled;
      document.documentElement.dataset.theme = next ? "light" : "dark";
      window.localStorage.setItem("skillbattle-theme", next ? "light" : "dark");
      return next;
    });
  }

  const level = dashboard?.stats?.level ?? user?.level ?? 1;
  const rating = dashboard?.stats?.rating ?? 1000;
  const xp = dashboard?.stats?.xp ?? 0;

  return (
    <header className="relative z-30 mx-2 mb-4 overflow-visible rounded-2xl border border-white/[0.06] bg-[#0c0a12] shadow-[0_18px_55px_rgba(0,0,0,.28)] md:mx-0 md:mb-6 md:rounded-2xl md:border-white/[0.06]">
      <div className="h-1 rounded-t-2xl bg-gradient-to-r from-fuchsia-600 via-violet-500 to-indigo-500 md:hidden" />
      <div className="relative hidden min-h-[88px] items-center gap-5 px-4 py-4 md:flex lg:px-5">
        <label className="flex h-12 w-[285px] items-center gap-3 rounded-xl border border-white/10 bg-[#111827] px-4 text-slate-400 transition focus-within:border-cyan-400/40 focus-within:text-cyan-300">
          <Search size={19} />
          <input
            aria-label="Search battles and users"
            placeholder="Search battles, users..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>
        <div className="ml-auto flex items-center gap-5">
          <div className="flex h-10 items-center gap-5 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] px-5 text-xs font-black uppercase tracking-wide">
            <span className="text-cyan-300">◉ LVL {level}</span>
            <span className="text-yellow-300">♜ {rating} RATING</span>
            <span className="text-violet-300">ϟ {xp} XP</span>
          </div>
          <NotificationMenu />
          <button
            type="button"
            aria-label="Toggle theme"
            aria-pressed={lightMode}
            onClick={toggleTheme}
            className="grid h-12 w-12 place-items-center rounded-xl border border-white/[0.08] bg-black/20 text-slate-200 transition hover:border-fuchsia-400/60 hover:bg-fuchsia-500/15 hover:text-white"
          >
            {lightMode ? <Moon size={21} /> : <Sun size={21} />}
          </button>
          <ProfileMenu />
        </div>
      </div>
      <div className="mobile-skillbattle-navbar relative flex min-h-[64px] w-full items-center justify-between gap-2 px-3 py-2 md:hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_40%,rgba(34,211,238,.12),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(127,0,255,.15),transparent_35%)]" />

        <div className="relative flex min-w-0 items-center">
          <button
            type="button"
            onClick={onMenuClick}
            className="group relative flex min-w-0 shrink-0 items-center"
            aria-label="Open navigation menu"
          >
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-[21px] font-black tracking-tight text-transparent">
              SkillBattle
            </span>
          </button>
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <NotificationMenu />
          <button
            type="button"
            aria-label="Toggle theme"
            aria-pressed={lightMode}
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-lg border border-transparent bg-transparent text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
          >
            {lightMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
