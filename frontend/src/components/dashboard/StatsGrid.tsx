"use client";

import { ArrowUpRight, Flame, Swords, Target } from "lucide-react";
import type { DashboardStats } from "@/types/dashboard";

export default function StatsGrid({ stats }: { stats: DashboardStats }) {
  const winRate = stats.battles_played ? Math.round((stats.battles_won / stats.battles_played) * 100) : null;
  const metrics = [
    { label: "Arena", value: stats.rating.toLocaleString(), detail: `${stats.battles_won} wins from ${stats.battles_played} battles`, icon: Swords, tone: "text-cyan-300" },
    { label: "Momentum", value: `${stats.streak} day${stats.streak === 1 ? "" : "s"}`, detail: "Current learning streak", icon: Flame, tone: "text-orange-300" },
    { label: "Skill growth", value: `${stats.xp.toLocaleString()} XP`, detail: winRate === null ? "Play a battle to establish a win rate" : `${winRate}% competitive win rate`, icon: Target, tone: "text-violet-300" },
  ];

  return (
    <section aria-label="Skill summary" className="grid overflow-hidden rounded-3xl border border-white/[0.09] bg-[#10131a] md:grid-cols-3">
      {metrics.map(({ label, value, detail, icon: Icon, tone }, index) => (
        <div key={label} className={`group relative min-w-0 px-5 py-5 sm:px-6 ${index ? "border-t border-white/[0.08] md:border-l md:border-t-0" : ""}`}>
          <div className="flex items-start justify-between gap-3"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p><Icon className={`h-4 w-4 ${tone}`} /></div>
          <p className="mt-5 text-2xl font-semibold tracking-tight text-white">{value}</p>
          <p className="mt-1 text-sm text-slate-400">{detail}</p>
          <ArrowUpRight className="absolute bottom-5 right-5 h-4 w-4 text-slate-700 transition group-hover:text-cyan-300 motion-reduce:transition-none" />
        </div>
      ))}
    </section>
  );
}
