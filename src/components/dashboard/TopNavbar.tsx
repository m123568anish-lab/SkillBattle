"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Search, Trophy } from "lucide-react";
import NotificationMenu from "./NotificationMenu";
import ProfileMenu from "./ProfileMenu";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";

interface TopNavbarProps {
  onMenuClick?: () => void;
}

export default function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const dashboard = useDashboardStore((s) => s.dashboard);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highContrast, setHighContrast] = useState(false);

  const level = dashboard?.stats?.level ?? user?.level ?? 1;
  const rating = dashboard?.stats?.rating ?? 1000;
  const xp = dashboard?.stats?.xp ?? 0;

  return (
    <header className="relative z-30 mb-6 overflow-visible border-b border-cyan-400/10 bg-[#080d18] shadow-[0_18px_55px_rgba(0,0,0,.32)]">
      <div className="h-1 bg-gradient-to-r from-cyan-400 via-violet-500 to-cyan-400" />
      <div className="relative flex min-h-[92px] items-center gap-3 px-3 py-3 sm:min-h-[112px] sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_40%,rgba(34,211,238,.10),transparent_28%),radial-gradient(circle_at_90%_0%,rgba(124,58,237,.12),transparent_30%)]" />

        <div className="relative flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={onMenuClick}
            className="group relative flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"
            aria-label="Open navigation menu"
          >
            <span className="relative grid h-10 w-10 place-items-center rounded-full bg-[conic-gradient(from_210deg,#22d3ee,#7c3aed,#2563eb,#22d3ee)] p-1 shadow-[0_0_28px_rgba(34,211,238,.35)] sm:h-16 sm:w-16">
            <span className="grid h-full w-full place-items-center rounded-full bg-[#080d18] text-cyan-200">
                <Trophy size={18} className="transition group-hover:scale-110 sm:h-7 sm:w-7" />
              </span>
            </span>
            <span className="text-left">
              <span className="block text-sm font-black tracking-tight text-white sm:text-2xl">SkillBattle</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">Arena</span>
            </span>
          </button>

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-200 sm:gap-3 sm:px-7 sm:py-3 sm:text-sm sm:tracking-[0.16em]">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,.9)] sm:h-3 sm:w-3" />
              Active
            </div>
            <div className="hidden items-center gap-4 rounded-full border border-white/[0.07] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 xl:flex">
              <span className="text-cyan-300">LVL {level}</span>
              <span>{rating} rating</span>
              <span className="text-cyan-300">{xp} XP</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-2 sm:gap-3">
          {searchOpen && (
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search battles and users"
              placeholder="Search..."
              className="absolute right-0 top-14 z-50 w-56 rounded-xl border border-cyan-400/30 bg-[#0d1626] px-4 py-3 text-sm text-white outline-none shadow-2xl shadow-black/50 ring-cyan-400/20 placeholder:text-slate-500 focus:ring-4 sm:static sm:top-auto sm:w-52"
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearchOpen(false);
                if (event.key === "Enter" && query.trim()) {
                  router.push(`/social?search=${encodeURIComponent(query.trim())}`);
                  setSearchOpen(false);
                }
              }}
            />
          )}
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/15 bg-cyan-400/5 text-cyan-100 transition hover:border-cyan-400/60 hover:bg-cyan-400/15 hover:text-white sm:h-14 sm:w-14"
          >
            <Search size={20} className="sm:h-[25px] sm:w-[25px]" />
          </button>
          <NotificationMenu />
          <button
            type="button"
            aria-label="Toggle theme"
            aria-pressed={highContrast}
            title="Dark theme"
            onClick={() => {
              setHighContrast((enabled) => {
                const next = !enabled;
                document.documentElement.dataset.contrast = next ? "high" : "normal";
                return next;
              });
            }}
            className="grid h-10 w-10 place-items-center rounded-xl border border-violet-400/15 bg-violet-400/5 text-violet-100 transition hover:border-violet-400/60 hover:bg-violet-400/15 hover:text-white sm:h-14 sm:w-14"
          >
            <Moon size={20} className="sm:h-[25px] sm:w-[25px]" />
          </button>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
