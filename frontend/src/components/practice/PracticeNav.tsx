"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  BookOpen,
  Briefcase,
  BarChart2,
  Flame,
  Zap,
} from "lucide-react";

export function PracticeNav() {
  const pathname = usePathname();

  const tabs = [
    { label: "Overview", href: "/practice", icon: BookOpen },
    { label: "Explore Topics", href: "/practice/topics", icon: Compass },
    { label: "Interview Prep", href: "/interview", icon: Briefcase },
    { label: "My Progress", href: "/practice/progress", icon: BarChart2 },
    { label: "Daily Challenge", href: "/challenge", icon: Flame },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-3 gap-3">
      <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href === "/practice/topics" && pathname.startsWith("/practice/topics"));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <Link
          href="/practice/session?mode=quick"
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all cursor-pointer whitespace-nowrap"
        >
          <Zap className="h-4 w-4 text-indigo-400" />
          <span>Quick Practice</span>
        </Link>
      </div>
    </div>
  );
}

export default PracticeNav;
