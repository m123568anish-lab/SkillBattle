"use client";

import { useEffect, useState } from "react";
import { Moon, Search, Sun, Menu, Command } from "lucide-react";
import NotificationMenu from "./NotificationMenu";
import ProfileMenu from "./ProfileMenu";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import Link from "next/link";

interface TopNavbarProps {
  onMenuClick?: () => void;
  onOpenSearch?: () => void;
}

export default function TopNavbar({ onMenuClick, onOpenSearch }: TopNavbarProps) {
  const user = useAuthStore((s) => s.user);
  const dashboard = useDashboardStore((s) => s.dashboard);
  const [lightMode, setLightMode] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("skillbattle-theme");
    const enabled = savedTheme === "light";
    setLightMode(enabled);
    document.documentElement.dataset.theme = enabled ? "light" : "dark";
    document.documentElement.style.colorScheme = enabled ? "light" : "dark";
  }, []);

  function toggleTheme() {
    setLightMode((enabled) => {
      const next = !enabled;
      document.documentElement.dataset.theme = next ? "light" : "dark";
      document.documentElement.style.colorScheme = next ? "light" : "dark";
      window.localStorage.setItem("skillbattle-theme", next ? "light" : "dark");
      return next;
    });
  }

  const level = dashboard?.stats?.level ?? user?.level ?? 1;
  const rating = dashboard?.stats?.rating ?? 1000;
  const xp = dashboard?.stats?.xp ?? 0;

  return (
    <header className="relative z-30 mx-0 mb-3 overflow-visible border-0 bg-transparent shadow-none md:mx-0 md:mb-6 md:rounded-2xl md:border md:border-white/[0.06] md:bg-[#0c0a12] md:shadow-[0_18px_55px_rgba(0,0,0,.28)]">
      {/* Desktop Header */}
      <div className="relative hidden min-h-[88px] items-center gap-5 px-4 py-4 md:flex lg:px-5">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex h-12 w-[285px] items-center gap-3 rounded-xl border border-white/10 bg-[#111827] px-4 text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-300 text-left"
        >
          <Search size={19} className="shrink-0" />
          <span className="min-w-0 flex-1 text-sm text-slate-400 truncate">
            Search battles, users...
          </span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            <Command size={10} />K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-5">
          <div className="flex h-10 items-center gap-4 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] px-4 text-xs font-black uppercase tracking-wide">
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

      {/* Mobile Top Navbar Header */}
      <div className="mobile-skillbattle-navbar relative flex min-h-[64px] w-full items-center justify-between gap-2 border-b border-white/10 bg-[#0F172A]/90 px-3 py-2 backdrop-blur-xl md:hidden">
        {/* Left: Menu Trigger + SkillBattle Logo (linking to /) */}
        <div className="relative flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:border-cyan-400/40 hover:text-cyan-300 transition"
            aria-label="Open navigation drawer"
          >
            <Menu size={20} />
          </button>

          <Link
            href="/"
            className="group flex items-center gap-2 text-left shrink-0"
            title="Go to Home"
          >
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-xl font-black tracking-tight text-transparent">
              SkillBattle
            </span>
          </Link>
        </div>

        {/* Right: Notifications, Theme Toggle, Profile Avatar */}
        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-cyan-300 transition"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
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
