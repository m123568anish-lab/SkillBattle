"use client";

import { Search, Trophy, Shield, Zap, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
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

  const level = dashboard?.stats?.level ?? 1;
  const rating = dashboard?.stats?.rating ?? 1000;
  const xp = dashboard?.stats?.xp ?? 0;
  const nextLevelXp = (level + 1) * 2500;
  const xpPercentage = Math.min((xp / nextLevelXp) * 100, 100);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored ? stored === "dark" : true;
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <header
      suppressHydrationWarning
      className="
        mb-5
        flex
        flex-row
        items-center
        gap-2
        rounded-2xl
        border
        border-white/10
        bg-white/90
        dark:bg-[#070B14]/80
        p-3
        backdrop-blur-xl
        sm:flex-row
        sm:items-center
        sm:justify-between
        sm:gap-4
        sm:p-4
        relative
        z-20
      "
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-400">
            <Trophy size={18} />
          </div>
          <span className="text-sm font-black tracking-tight text-white">SkillBattle</span>
        </div>

        <div
          suppressHydrationWarning
          className="
            flex
            flex-1
            items-center
            min-w-0
            flex-1
            gap-2.5
            rounded-xl
            border
            border-white/10
            bg-[#0F172A]
            px-3
            py-2.5
            transition
            focus-within:border-cyan-400
            hidden
            md:flex
            w-full
            max-w-xs
          "
        >
          <Search
            size={18}
            className="text-slate-400"
          />
          <input
            suppressHydrationWarning
            placeholder="Search battles, users..."
            className="
              w-full
              bg-transparent
              text-sm
              text-white
              outline-none
              placeholder:text-slate-500
            "
          />
        </div>
      </div>

      {/* Profile & Live Rating Ribbon */}
      <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-5">
        {user && (
          <div className="hidden md:flex items-center gap-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-cyan-400" />
              <span>LVL {level}</span>
            </div>
            <div className="h-3 w-[1px] bg-cyan-500/20" />
            <div className="flex items-center gap-1.5">
              <Trophy size={14} className="text-yellow-400" />
              <span>{rating} Rating</span>
            </div>
            <div className="h-3 w-[1px] bg-cyan-500/20" />
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-violet-400" />
              <span>{xp} XP</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Search"
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-600 transition-colors duration-300 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <NotificationMenu />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}