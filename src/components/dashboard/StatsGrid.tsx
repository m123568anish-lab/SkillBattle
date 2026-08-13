"use client";

import { motion } from "framer-motion";
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
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`
              group
              rounded-3xl
              border
              border-white/10
              bg-gradient-to-b
              from-white/5
              to-[#090D1A]/40
              p-6
              backdrop-blur-xl
              transition-all
              duration-300
              relative
              overflow-hidden
              ${card.borderGlow}
            `}
          >
            {/* Soft inner glow behind card */}
            <div className={`absolute -right-12 -bottom-12 h-32 w-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${card.bgGlow}`} />

            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-4">
                <div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${card.badgeColor}`}>
                    {card.title}
                  </span>
                  <h2 className="mt-3.5 text-3.5xl font-black text-white tracking-tight">
                    {card.value}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 leading-snug">
                  {card.desc}
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#0D1226]/80 p-3.5 shadow-md shadow-black/20 group-hover:border-white/15 transition-colors">
                <Icon size={24} className={`${card.color} transition-transform duration-300 group-hover:scale-110`} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}