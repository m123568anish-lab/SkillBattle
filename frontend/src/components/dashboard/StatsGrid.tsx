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
      title: "Battles Won",
      value: stats.battles_won,
      icon: Trophy,
      color: "text-cyan-400",
      bgGlow: "group-hover:bg-cyan-500/10",
      borderGlow: "group-hover:border-cyan-500/30",
      badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
      desc: "Total victories achieved"
    },
    {
      title: "Win Rate",
      value: `${winRate}%`,
      icon: Target,
      color: "text-emerald-400",
      bgGlow: "group-hover:bg-emerald-500/10",
      borderGlow: "group-hover:border-emerald-500/30",
      badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
      desc: "Accuracy performance ratio"
    },
    {
      title: "Current Streak",
      value: `${stats.streak} Days`,
      icon: Flame,
      color: "text-orange-400",
      bgGlow: "group-hover:bg-orange-500/10",
      borderGlow: "group-hover:border-orange-500/30",
      badgeColor: "bg-orange-500/10 text-orange-300 border-orange-500/20",
      desc: "Consecutive active days"
    },
    {
      title: "Total XP",
      value: stats.xp.toLocaleString(),
      icon: Gem,
      color: "text-violet-400",
      bgGlow: "group-hover:bg-violet-500/10",
      borderGlow: "group-hover:border-violet-500/30",
      badgeColor: "bg-violet-500/10 text-violet-300 border-violet-500/20",
      desc: "Cumulative player score"
    },
    {
      title: "Player Level",
      value: `Lv. ${stats.level}`,
      icon: Trophy,
      color: "text-yellow-400",
      bgGlow: "group-hover:bg-yellow-500/10",
      borderGlow: "group-hover:border-yellow-500/30",
      badgeColor: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
      desc: "Progression level rank"
    },
    {
      title: "Rating",
      value: stats.rating.toLocaleString(),
      icon: Gem,
      color: "text-pink-400",
      bgGlow: "group-hover:bg-pink-500/10",
      borderGlow: "group-hover:border-pink-500/30",
      badgeColor: "bg-pink-500/10 text-pink-300 border-pink-500/20",
      desc: "Competitive Elo rating"
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`
              group
              rounded-2xl
              border
              border-white/[0.08]
              bg-[#0a0f1d]
              p-5
              transition-all
              duration-200
              relative
              overflow-hidden
              hover:border-white/20
              ${card.borderGlow}
            `}
          >
            {/* Subtle card glow */}
            <div className={`absolute -right-12 -bottom-12 h-28 w-28 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${card.bgGlow}`} />

            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-3">
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${card.badgeColor}`}>
                  {card.title}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {card.value}
                </h2>
                <p className="text-xs text-slate-400 leading-snug">
                  {card.desc}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#060913] p-3 shadow-md group-hover:border-white/15 transition-colors">
                <Icon size={22} className={`${card.color} transition-transform duration-200 group-hover:scale-105`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}