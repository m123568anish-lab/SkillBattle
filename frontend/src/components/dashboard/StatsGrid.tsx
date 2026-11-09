"use client";

import { ArrowUpRight, Flame, Swords, Target } from "lucide-react";
import CountUp from "react-countup";
import { useReducedMotion } from "framer-motion";
import type { DashboardStats } from "@/types/dashboard";

export default function StatsGrid({ stats }: { stats: DashboardStats }) {
  const shouldReduceMotion = useReducedMotion();
  const winRate = stats.battles_played
    ? Math.round((stats.battles_won / stats.battles_played) * 100)
    : null;

  const metrics = [
    {
      label: "Competitive Rating",
      rawNumber: stats.rating,
      suffix: "",
      detail: `${stats.battles_won}W · ${stats.battles_lost}L · ${stats.battles_completed} completed`,
      icon: Swords,
      tone: "text-[var(--accent-strong)]",
    },
    {
      label: "Active Momentum",
      rawNumber: stats.streak,
      suffix: stats.streak === 1 ? " day" : " days",
      detail: `${stats.longest_streak} days longest streak`,
      icon: Flame,
      tone: stats.streak >= 3 ? "text-amber-400" : "text-[var(--text-muted)]",
    },
    {
      label: "Mastery Experience",
      rawNumber: stats.xp,
      suffix: " XP",
      detail: `${stats.practice_completed} solved · ${winRate === null ? "no completed battles" : `${winRate}% battle win rate`}`,
      icon: Target,
      tone: "text-[var(--accent-secondary-strong)]",
    },
  ];

  return (
    <section
      aria-label="Skill summary"
      className="grid overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] md:grid-cols-3 shadow-xl"
    >
      {metrics.map(({ label, rawNumber, suffix, detail, icon: Icon, tone }, index) => (
        <div
          key={label}
          className={`group relative min-w-0 px-5 py-5 sm:px-6 transition-all duration-200 hover:bg-[var(--surface-elevated)] ${
            index
              ? "border-t border-[var(--border-subtle)] md:border-l md:border-t-0"
              : ""
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {label}
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)] transition-colors duration-200 group-hover:border-[var(--accent)]/30">
              <Icon className={`h-4 w-4 ${tone} transition-transform duration-200 group-hover:scale-110`} />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-1 text-2xl font-bold tracking-tight text-[var(--text-primary)] font-mono">
            {shouldReduceMotion ? (
              <span>{rawNumber.toLocaleString()}</span>
            ) : (
              <CountUp
                end={rawNumber}
                duration={1.6}
                separator=","
                preserveValue
              />
            )}
            <span className="text-sm font-sans font-medium text-[var(--text-muted)]">{suffix}</span>
          </div>

          <p className="mt-1 text-xs text-[var(--text-secondary)]">{detail}</p>

          <ArrowUpRight className="absolute bottom-5 right-5 h-4 w-4 text-[var(--text-muted)] opacity-30 transition-all duration-200 group-hover:opacity-100 group-hover:text-[var(--accent-strong)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" />
        </div>
      ))}
    </section>
  );
}
