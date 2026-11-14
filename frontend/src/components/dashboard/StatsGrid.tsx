"use client";

import { Activity, Flame, Trophy, BookOpenCheck, Gauge } from "lucide-react";
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
      detail: "Earned across your activity",
      icon: Trophy,
      accent: true,
    },
    {
      label: "Daily streak",
      value: stats.streak,
      suffix: "days",
      detail: `Best: ${stats.longest_streak} days`,
      icon: Flame,
      accent: false,
    },
    {
      label: "Current level",
      value: stats.level,
      suffix: "",
      detail: `${stats.xp_to_next_level.toLocaleString()} XP to next level`,
      icon: Gauge,
      accent: false,
    },
    {
      label: "Practice completed",
      value: stats.practice_completed,
      suffix: "",
      detail: stats.practice_accuracy == null
        ? `${stats.practice_attempted.toLocaleString()} attempts recorded`
        : `${Math.round(stats.practice_accuracy)}% practice accuracy`,
      icon: BookOpenCheck,
      accent: false,
    },
    {
      label: "Arena rating",
      value: stats.rating,
      suffix: "",
      detail: `${stats.battles_won.toLocaleString()} wins · ${stats.battles_completed.toLocaleString()} completed`,
      icon: Activity,
      accent: false,
    },
  ];

  return (
    <section
      aria-label="Performance overview"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5"
    >
      {metrics.map(({ label, value, suffix, detail, icon: Icon, accent }) => (
        <div
          key={label}
          className="q-panel min-w-0 p-4 sm:p-5"
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
