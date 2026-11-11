"use client";

import { Activity, BookOpenCheck, Swords, Trophy } from "lucide-react";
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
      label: "Total XP",
      rawNumber: stats.xp,
      suffix: "XP",
      detail: `Level ${stats.level} · ${stats.xp_to_next_level.toLocaleString()} to next level`,
      icon: Trophy,
      tone: "text-[var(--accent-strong)]",
    },
    {
      label: "Arena rating",
      rawNumber: stats.rating,
      suffix: "",
      detail: stats.battles_played
        ? `${stats.battles_won} wins · ${stats.battles_lost} losses`
        : "Play a battle to establish your record",
      icon: Swords,
      tone: "text-[var(--text-secondary)]",
    },
    {
      label: "Practice solved",
      rawNumber: stats.practice_completed,
      suffix: "",
      detail: stats.practice_accuracy == null
        ? `${stats.practice_attempted} attempts recorded`
        : `${Math.round(stats.practice_accuracy)}% practice accuracy`,
      icon: BookOpenCheck,
      tone: "text-[var(--text-secondary)]",
    },
    {
      label: "Battles completed",
      rawNumber: stats.battles_completed,
      suffix: "",
      detail: winRate === null ? "Your competitive record starts here" : `${winRate}% battle win rate`,
      icon: Activity,
      tone: "text-[var(--text-secondary)]",
    },
  ];

  return (
    <section
      aria-label="Skill summary"
      className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] xl:grid-cols-4"
    >
      {metrics.map(({ label, rawNumber, suffix, detail, icon: Icon, tone }, index) => (
        <div
          key={label}
          className={`relative min-w-0 px-4 py-4 sm:px-6 sm:py-5 ${
            index % 2 ? "border-l border-[var(--border-subtle)]" : ""
          } ${
            index > 1 ? "border-t border-[var(--border-subtle)] xl:border-t-0" : ""
          } ${
            index % 4 > 0 ? "xl:border-l" : "xl:border-l-0"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {label}
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
              <Icon className={`h-4 w-4 ${tone}`} />
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
            {suffix && <span className="text-sm font-sans font-medium text-[var(--text-muted)]">{suffix}</span>}
          </div>

          <p className="mt-1 text-xs text-[var(--text-secondary)]">{detail}</p>
        </div>
      ))}
    </section>
  );
}
