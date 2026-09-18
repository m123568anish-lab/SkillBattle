"use client";

import { Search, Menu, Trophy, Shield, Zap } from "lucide-react";
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

  return (
    <header
      suppressHydrationWarning
      className="
        mb-8
        flex
        flex-col
        gap-4
        rounded-2xl
        border
        border-white/10
        bg-[#070B14]/80
        p-4
        backdrop-blur-xl
        sm:flex-row
        sm:items-center
        sm:justify-between
        relative
        z-20
      "
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-xl border border-white/10 bg-white/5 p-2.5 text-white hover:bg-white/10 transition"
        >
          <Menu size={20} />
        </button>

        <div
          suppressHydrationWarning
          className="
            flex
            flex-1
            items-center
            gap-3
            rounded-xl
            border
            border-white/10
            bg-[#0F172A]
            px-4
            py-2.5
            transition
            focus-within:border-cyan-400
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
      <div className="flex flex-wrap items-center gap-3.5 sm:gap-5 justify-end">
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

        <div className="flex items-center gap-3">
          <NotificationMenu />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}