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
} from "lucide-react";

export function BattleNav() {
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-rose-500/20 pb-3 gap-3">
      <nav
        aria-label="Battle Arena Tabs"
        className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none py-1 min-w-max"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                active
                  ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/35 shadow-sm shadow-rose-500/15"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] border border-transparent"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-transform ${
                  active ? "text-rose-400 scale-105" : "text-slate-400"
                }`}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Leaderboard Shortcut */}
      <div className="hidden lg:flex items-center gap-1.5 shrink-0 pl-2">
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
    </div>
  );
}

export default BattleNav;
