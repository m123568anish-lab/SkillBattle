"use client";

import { Activity, Flame, Trophy, BookOpenCheck, ShieldCheck } from "lucide-react";
import CountUp from "react-countup";
import { useReducedMotion } from "framer-motion";
import type { DashboardStats } from "@/types/dashboard";

export default function StatsGrid({ stats }: { stats: DashboardStats }) {
  const shouldReduceMotion = useReducedMotion();

  const metrics = [
    {
      label: "Lifetime XP",
      value: stats.xp,
      suffix: "XP",
      detail: `${stats.xp_to_next_level.toLocaleString()} to next tier`,
      icon: Trophy,
      color: "text-[var(--accent-strong)]",
      bg: "bg-[var(--accent)]/10",
      border: "border-[var(--accent)]/25",
    },
    {
      label: "Daily Streak",
      value: stats.streak,
      suffix: stats.streak === 1 ? "day" : "days",
      detail: `Personal record: ${stats.longest_streak} days`,
      icon: Flame,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/25",
    },
    {
      label: "Arena Rating",
      value: stats.rating,
      suffix: "ELO",
      detail: `${stats.battles_won.toLocaleString()} wins · ${stats.battles_completed.toLocaleString()} completed`,
      icon: Activity,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/25",
    },
    {
      label: "Practice Problems",
      value: stats.practice_completed,
      suffix: "solved",
      detail:
        stats.practice_accuracy == null
          ? `${stats.practice_attempted.toLocaleString()} attempts logged`
          : `${Math.round(stats.practice_accuracy)}% submission accuracy`,
      icon: BookOpenCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
    },
    {
      label: "Engineering Level",
      value: stats.level,
      suffix: "Tier",
      detail: `Progress: ${Math.round(stats.level_progress_percent)}%`,
      icon: ShieldCheck,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/25",
    },
  ];

  return (
    <section
      aria-label="Performance overview"
      className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-5"
    >
      {metrics.map(
        ({ label, value, suffix, detail, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className="group relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4.5 sm:p-5 transition-all duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--surface-elevated)] hover:shadow-lg"
          >
            {/* Top row: Label & Icon */}
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] sm:text-[11px]">
                {label}
              </span>
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${border} ${bg} ${color} transition-transform group-hover:scale-110`}
              >
                <Icon size={14} aria-hidden="true" />
              </span>
            </div>

            {/* Value Counter */}
            <p className="mt-3 flex items-baseline gap-1.5 font-mono text-2xl font-black tabular-nums tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {shouldReduceMotion ? (
                <span>{value.toLocaleString()}</span>
              ) : (
                <CountUp end={value} duration={1} separator="," preserveValue />
              )}
              {suffix && (
                <span className="font-sans text-xs font-semibold text-[var(--text-muted)]">
                  {suffix}
                </span>
              )}
            </p>

            {/* Detail text */}
            <p className="mt-1.5 min-h-8 text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-2 sm:min-h-4 sm:truncate">
              {detail}
            </p>
          </div>
        )
      )}
    </section>
  );
}
