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
  const [searchOpen, setSearchOpen] = useState(false);
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
      <div className="relative flex min-h-[68px] items-center gap-2 px-2.5 py-2 sm:min-h-[112px] sm:gap-3 sm:px-6 sm:py-3 lg:px-8 md:hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_40%,rgba(168,85,247,.12),transparent_28%),radial-gradient(circle_at_90%_0%,rgba(79,70,229,.10),transparent_30%)]" />

        <div className="relative flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={onMenuClick}
            className="group relative flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"
            aria-label="Open navigation menu"
          >
            <span className="relative grid h-8 w-8 place-items-center rounded-full bg-[conic-gradient(from_210deg,#ec0bb8,#7c3aed,#2563eb,#ec0bb8)] p-1 shadow-[0_0_20px_rgba(168,85,247,.35)] sm:h-16 sm:w-16">
              <span className="grid h-full w-full place-items-center rounded-full bg-[#0c0a12] text-fuchsia-200">
                <Trophy size={14} className="transition group-hover:scale-110 sm:h-7 sm:w-7" />
              </span>
            </span>
            <span className="text-left">
              <span className="block text-xs font-black tracking-tight text-white sm:text-2xl">SkillBattle</span>
              <span className="block text-[8px] font-bold uppercase tracking-[0.22em] text-violet-300 sm:text-[10px] sm:tracking-[0.3em]">Arena</span>
            </span>
          </button>

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-1.5 rounded-full border border-white/[0.07] bg-black/20 px-2.5 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-300 sm:flex sm:gap-3 sm:px-7 sm:py-3 sm:text-sm sm:tracking-[0.16em]">
              <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_14px_rgba(167,139,250,.9)] sm:h-3 sm:w-3" />
              Active
            </div>
            <div className="hidden items-center gap-4 rounded-full border border-white/[0.07] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 xl:flex">
              <span className="text-cyan-300">LVL {level}</span>
              <span>{rating} rating</span>
              <span className="text-violet-300">{xp} XP</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-2 sm:gap-3">
          {searchOpen && (
            <input
              autoFocus
              aria-label="Search battles and users"
              placeholder="Search..."
              className="absolute right-0 top-14 z-50 w-52 rounded-full border border-violet-400/30 bg-[#171329] px-4 py-3 text-sm text-white outline-none ring-violet-400/20 placeholder:text-slate-500 focus:ring-4 sm:static sm:top-auto sm:w-48"
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearchOpen(false);
              }}
            />
          )}
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((open) => !open)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-black/20 text-slate-200 transition hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-white sm:h-14 sm:w-14"
          >
            <Search size={17} className="sm:h-[25px] sm:w-[25px]" />
          </button>
          <NotificationMenu />
          <button
            type="button"
            aria-label="Toggle theme"
            aria-pressed={lightMode}
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-black/20 text-slate-200 transition hover:border-fuchsia-400/60 hover:bg-fuchsia-500/15 hover:text-white sm:h-14 sm:w-14"
          >
            {lightMode ? <Moon size={17} className="sm:h-[25px] sm:w-[25px]" /> : <Sun size={17} className="sm:h-[25px] sm:w-[25px]" />}
          </button>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
