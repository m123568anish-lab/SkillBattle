"use client";

import { Activity, Flame, Trophy, BookOpenCheck } from "lucide-react";
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
      label: "Lifetime XP",
      value: stats.xp,
      suffix: "XP",
      detail: "Earned across your activity",
      icon: Trophy,
      accent: true,
    },
    {
      label: "Current streak",
      value: stats.streak,
      suffix: "days",
      detail: `Best: ${stats.longest_streak} days`,
      icon: Flame,
      accent: false,
    },
    {
      label: "Arena rating",
      value: stats.rating,
      suffix: "",
      detail: winRate === null
        ? "Play a match to establish your record"
        : `${stats.battles_won} wins · ${winRate}% win rate`,
      icon: Activity,
      accent: false,
    },
    {
      label: "Practice solved",
      value: stats.practice_completed,
      suffix: "",
      detail: stats.practice_accuracy == null
        ? `${stats.practice_attempted} attempts recorded`
        : `${Math.round(stats.practice_accuracy)}% practice accuracy`,
      icon: BookOpenCheck,
      accent: false,
    },
  ];

  return (
    <section
      aria-label="Performance overview"
      className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] xl:grid-cols-4"
    >
      {metrics.map(({ label, value, suffix, detail, icon: Icon, accent }, index) => (
        <div
          key={label}
          className={`min-w-0 px-4 py-4 sm:px-5 sm:py-5 ${
            index % 2 ? "border-l border-[var(--border-subtle)]" : ""
          } ${
            index > 1 ? "border-t border-[var(--border-subtle)] xl:border-t-0" : ""
          } ${
            index % 4 > 0 ? "xl:border-l" : "xl:border-l-0"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] sm:text-[11px]">
              {label}
            </p>
            <Icon
              aria-hidden="true"
              className={`h-4 w-4 shrink-0 ${accent ? "text-[var(--accent-strong)]" : "text-[var(--text-muted)]"}`}
            />
          </div>

          <p className="mt-3 flex items-baseline gap-1 font-mono text-2xl font-semibold tabular-nums tracking-tight text-[var(--text-primary)]">
            {shouldReduceMotion ? (
              <span>{value.toLocaleString()}</span>
            ) : (
              <CountUp end={value} duration={1} separator="," preserveValue />
            )}
            {suffix && <span className="font-sans text-xs font-medium text-[var(--text-muted)]">{suffix}</span>}
          </p>
          <p className="mt-1 min-h-8 break-words text-xs leading-4 text-[var(--text-secondary)] line-clamp-2 sm:min-h-4 sm:truncate">{detail}</p>
        </div>
      ))}
    </section>
  );
}
