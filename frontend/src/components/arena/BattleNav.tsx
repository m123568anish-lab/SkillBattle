"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sword,
  Target,
  Users,
  Trophy,
  History,
  BarChart3,
  Flame,
} from "lucide-react";

interface BattleNavProps {
  className?: string;
}

export function BattleNav({ className = "" }: BattleNavProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Overview",
      href: "/battle",
      icon: Sword,
      isActive: pathname === "/battle",
    },
    {
      label: "Solo Battle",
      href: "/battle/solo",
      icon: Target,
      isActive: pathname.startsWith("/battle/solo"),
    },
    {
      label: "Multiplayer",
      href: "/battle/lobby",
      icon: Users,
      isActive: pathname.startsWith("/battle/lobby") || pathname.startsWith("/battle/waiting"),
    },
    {
      label: "Daily Championship",
      href: "/battle/championship",
      icon: Trophy,
      isActive: pathname.startsWith("/battle/championship"),
    },
    {
      label: "Battle History",
      href: "/battle/history",
      icon: History,
      isActive: pathname.startsWith("/battle/history"),
    },
  ];

  return (
    <nav
      aria-label="Battle Arena Navigation"
      className={`relative flex items-center justify-between gap-2 overflow-x-auto rounded-2xl border border-rose-500/20 bg-[#120B15]/90 p-1.5 backdrop-blur-md scrollbar-none ${className}`}
    >
      <div className="flex items-center gap-1 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                active
                  ? "bg-rose-500/15 text-rose-300 font-bold shadow-sm shadow-rose-500/20 border border-rose-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-transform ${
                  active ? "text-rose-400 scale-105" : "text-slate-400"
                }`}
              />
              <span>{tab.label}</span>
              {active && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-rose-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Global Leaderboard Shortcut */}
      <div className="hidden sm:flex items-center gap-1 shrink-0 pl-2 border-l border-white/10">
        <Link
          href="/leaderboard"
          title="Global Championship Leaderboard"
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            pathname.startsWith("/leaderboard")
              ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
              : "text-slate-400 hover:text-amber-300 hover:bg-white/5"
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5 text-amber-400" />
          <span>Leaderboard</span>
        </Link>
      </div>
    </nav>
  );
}
