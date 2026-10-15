"use client";

import { Trophy, Target, Flame, Gem } from "lucide-react";
import type { DashboardStats } from "@/types/dashboard";

interface StatsGridProps {
  stats: DashboardStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const winRate =
    stats.battles_played === 0
      ? 0
      : Math.round((stats.battles_won / stats.battles_played) * 100);

  const cards = [
    {
      title: "Battle record",
      value: `${stats.battles_won} / ${stats.battles_played}`,
      icon: Trophy,
      color: "text-cyan-400",
      bgGlow: "group-hover:bg-cyan-500/10",
      borderGlow: "group-hover:border-cyan-500/30",
      badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
      desc: "Wins / battles played"
    },
    {
      title: "Win rate",
      value: `${winRate}%`,
      icon: Target,
      color: "text-emerald-400",
      bgGlow: "group-hover:bg-emerald-500/10",
      borderGlow: "group-hover:border-emerald-500/30",
      badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
      desc: "Competitive performance"
    },
    {
      title: "Daily streak",
      value: `${stats.streak} days`,
      icon: Flame,
      color: "text-orange-400",
      bgGlow: "group-hover:bg-orange-500/10",
      borderGlow: "group-hover:border-orange-500/30",
      badgeColor: "bg-orange-500/10 text-orange-300 border-orange-500/20",
      desc: "Keep your momentum"
    },
    {
      title: "Experience",
      value: `${stats.xp.toLocaleString()} XP`,
      icon: Gem,
      color: "text-violet-400",
      bgGlow: "group-hover:bg-violet-500/10",
      borderGlow: "group-hover:border-violet-500/30",
      badgeColor: "bg-violet-500/10 text-violet-300 border-violet-500/20",
      desc: "Progress earned"
    },
    {
      title: "Level",
      value: `Lv. ${stats.level}`,
      icon: Trophy,
      color: "text-yellow-400",
      bgGlow: "group-hover:bg-yellow-500/10",
      borderGlow: "group-hover:border-yellow-500/30",
      badgeColor: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
      desc: "Your current rank"
    },
    {
      title: "Arena rating",
      value: stats.rating.toLocaleString(),
      icon: Gem,
      color: "text-pink-400",
      bgGlow: "group-hover:bg-pink-500/10",
      borderGlow: "group-hover:border-pink-500/30",
      badgeColor: "bg-pink-500/10 text-pink-300 border-pink-500/20",
      desc: "Matchmaking score"
    },
  ];

  return (
    <section aria-label="Your progress" className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] px-4 py-3 sm:px-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Your progress</p>
        <p className="text-[10px] font-medium text-slate-500">Updated from your activity</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 transition-colors hover:border-white/15 sm:px-3.5"
          >
            <div className={`rounded-xl border border-white/[0.06] bg-[#060913] p-2 ${card.color}`}>
              <Icon size={17} />
            </div>
            <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {card.title}
                </p>
                <h2 className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
                  {card.value}
                </h2>
                <p className="hidden truncate text-[10px] text-slate-500 sm:block">{card.desc}</p>
            </div>
          </div>
        );
      })}
      </div>
    </section>
  );
}
