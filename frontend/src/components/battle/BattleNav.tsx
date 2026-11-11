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
      label: "Solo Challenges",
      href: "/battle/solo",
      icon: Target,
      isActive: pathname.startsWith("/battle/solo"),
    },
    {
      label: "Arena Duels",
      href: "/battle/lobby",
      icon: Users,
      isActive: pathname.startsWith("/battle/lobby") || pathname.startsWith("/battle/waiting"),
    },
    {
      label: "Daily Clash",
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
    <div className="flex flex-col gap-3 border-b border-[#252525] pb-3 sm:flex-row sm:items-center sm:justify-between">
      <nav
        aria-label="Qubira Arena Tabs"
        className="flex min-w-max items-center gap-1.5 overflow-x-auto py-1 sm:gap-2"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                active
                  ? "border-[#D8FF3E]/35 bg-[#D8FF3E]/10 text-[#F5F5F5] shadow-[0_0_0_1px_rgba(216,255,62,0.12)]"
                  : "border-transparent text-[#A1A1AA] hover:border-[#252525] hover:bg-[#101010] hover:text-[#F5F5F5]"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-transform ${
                  active ? "scale-105 text-[#D8FF3E]" : "text-[#A1A1AA]"
                }`}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden items-center gap-1.5 pl-2 lg:flex">
        <Link
          href="/leaderboard"
          title="Qubira Rankings"
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            pathname.startsWith("/leaderboard")
              ? "border-[#D8FF3E]/35 bg-[#D8FF3E]/10 text-[#F5F5F5]"
              : "border-transparent text-[#A1A1AA] hover:border-[#252525] hover:bg-[#101010] hover:text-[#F5F5F5]"
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5 text-[#D8FF3E]" />
          <span>Qubira Rankings</span>
        </Link>
      </div>
    </div>
  );
}

export default BattleNav;
