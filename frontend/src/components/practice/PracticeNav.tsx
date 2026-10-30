"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Layers3,
  Brain,
  Code2,
  Flame,
  Activity,
  Bookmark,
  Sparkles,
} from "lucide-react";

export function PracticeNav() {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Overview",
      href: "/practice",
      icon: BookOpen,
      isActive: pathname === "/practice",
    },
    {
      label: "Explore",
      href: "/practice/topics",
      icon: Layers3,
      isActive: pathname.startsWith("/practice/topics"),
    },
    {
      label: "MCQ Practice",
      href: "/practice/mcq",
      icon: Brain,
      isActive: pathname.startsWith("/practice/mcq") || pathname.startsWith("/practice/session"),
    },
    {
      label: "Coding Practice",
      href: "/practice/coding",
      icon: Code2,
      isActive: pathname.startsWith("/practice/coding"),
    },
    {
      label: "Tasks & Challenges",
      href: "/practice/tasks",
      icon: Flame,
      isActive: pathname.startsWith("/practice/tasks"),
    },
    {
      label: "My Progress",
      href: "/practice/progress",
      icon: Activity,
      isActive: pathname.startsWith("/practice/progress"),
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-3 gap-3">
      <nav
        aria-label="Practice Hub Tabs"
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
                  ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/35 shadow-sm shadow-cyan-500/15"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] border border-transparent"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-transform ${
                  active ? "text-cyan-400 scale-105" : "text-slate-400"
                }`}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Secondary Quick Access Links */}
      <div className="hidden lg:flex items-center gap-1.5 shrink-0 pl-2">
        <Link
          href="/practice/saved"
          title="Saved Revision Deck"
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            pathname.startsWith("/practice/saved")
              ? "bg-white/10 text-white font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Bookmark className="h-3.5 w-3.5 text-cyan-400" />
          <span>Saved</span>
        </Link>
        <Link
          href="/practice/recommendations"
          title="AI Learning Guide"
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            pathname.startsWith("/practice/recommendations")
              ? "bg-white/10 text-white font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>AI Guide</span>
        </Link>
      </div>
    </div>
  );
}

export default PracticeNav;
