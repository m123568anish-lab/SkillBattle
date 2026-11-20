"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Flame,
  Sparkles,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";
import type { UserSummary, DashboardStats } from "@/types/dashboard";
import { formatDashboardNumber } from "@/lib/dashboard-data.mjs";

interface DashboardHeroProps {
  user: UserSummary;
  stats: DashboardStats;
  learningGoal?: string;
  nextAction?: string;
}

export default function DashboardHero({
  user,
  stats,
  learningGoal,
  nextAction,
}: DashboardHeroProps) {
  const firstName =
    user.full_name?.trim().split(/\s+/)[0] || user.username || "Learner";
  const level = Math.max(1, Number.isFinite(stats.level) ? stats.level : 1);
  const progress = Number.isFinite(stats.level_progress_percent)
    ? Math.min(100, Math.max(0, stats.level_progress_percent))
    : 0;

  const initials = (user.full_name || user.username || "QB")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const avatarUrl = user.avatar_url || user.avatar || null;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <section
      data-dashboard-hero
      aria-labelledby="dashboard-welcome-title"
      className="relative overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[linear-gradient(135deg,rgba(216,255,62,0.06)_0%,rgba(16,16,16,0.95)_45%,rgba(8,8,8,1)_100%)] p-6 shadow-2xl transition-all sm:p-8 xl:p-9"
    >
      {/* Decorative ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--accent)]/10 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]"
      />

      <div className="relative z-10 grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)] xl:items-stretch">
        {/* Left Column: Greeting, Goal & Actions */}
        <div className="flex min-w-0 flex-col justify-between gap-6">
          <div>
            {/* Header Telemetry Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--accent-strong)]">
                <Sparkles size={12} className="text-[var(--accent)]" />
                Placement Command Center
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[11px] font-bold text-amber-300">
                <Flame size={12} className={stats.streak > 0 ? "text-amber-400 fill-amber-400/20" : "text-amber-400/50"} />
                {stats.streak} day streak
              </span>
            </div>

            {/* Dynamic Personalized Title */}
            <h1
              id="dashboard-welcome-title"
              className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl xl:text-5xl"
            >
              {greeting},{" "}
              <span className="bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent-strong)] to-[var(--accent)] bg-clip-text text-transparent">
                {firstName}
              </span>
              .
            </h1>

            <p className="mt-2.5 max-w-2xl text-sm font-medium leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Sharpen your core engineering skills, win live coding duels, and accelerate your placement readiness.
            </p>
          </div>

          {/* Active Goal / Roadmap Snapshot */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)]/80 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt=""
                    width={48}
                    height={48}
                    unoptimized
                    className="h-12 w-12 rounded-xl border border-[var(--accent)]/30 object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="grid h-12 w-12 place-items-center rounded-xl border border-[var(--accent)]/30 bg-[var(--surface-elevated)] font-mono text-base font-bold text-[var(--accent-strong)]"
                  >
                    {initials || "QB"}
                  </div>
                )}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--surface-card)] bg-emerald-400"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Compass size={13} className="text-[var(--accent-strong)] shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    {learningGoal ? "Active Learning Goal" : "Roadmap Target"}
                  </p>
                </div>
                <p className="mt-1 truncate text-sm font-bold text-[var(--text-primary)]">
                  {learningGoal || "Set up a personalized roadmap to track placement progress"}
                </p>
                {nextAction && (
                  <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--accent-strong)]">Next up:</span> {nextAction}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/practice"
              className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-[var(--text-on-accent)] shadow-[0_0_20px_rgba(216,255,62,0.25)] transition-all hover:bg-[var(--accent-strong)] hover:shadow-[0_0_28px_rgba(216,255,62,0.4)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              <BookOpen size={16} aria-hidden="true" />
              <span>Resume Learning</span>
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/battle"
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-5 text-sm font-bold text-[var(--text-primary)] transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--surface-subtle)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              <Swords size={16} aria-hidden="true" className="text-[var(--accent-strong)]" />
              <span>Enter Battle Arena</span>
            </Link>

            <Link
              href="/coach"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-transparent px-3 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              <Sparkles size={14} className="text-cyan-400" />
              <span>AI Coach</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Level & XP Telemetry Card */}
        <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)]/90 p-5 shadow-xl backdrop-blur-md sm:p-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  <Zap size={13} className="text-[var(--accent-strong)]" />
                  Engineering Rank
                </p>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <p className="text-3xl font-black tracking-tight text-[var(--text-primary)] sm:text-4xl">
                    Level {level}
                  </p>
                  <span className="font-mono text-xs font-semibold text-[var(--text-muted)]">
                    / 100
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1.5 font-mono text-xs font-bold tabular-nums text-[var(--accent-strong)]">
                {progress}% Complete
              </div>
            </div>

            {/* Level Progress Gauge Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                <span>Current Tier Progress</span>
                <span className="font-mono tabular-nums text-[var(--accent-strong)]">
                  {formatDashboardNumber(stats.xp)} XP
                </span>
              </div>

              <div
                className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-[var(--surface-elevated)] p-0.5 border border-[var(--border-subtle)]"
                role="progressbar"
                aria-label="Progress to next level"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] shadow-[0_0_12px_rgba(216,255,62,0.5)] transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>
                  <strong className="font-mono text-[var(--text-primary)]">
                    {formatDashboardNumber(stats.xp_to_next_level)}
                  </strong>{" "}
                  XP to Level {level + 1}
                </span>
                <span className="font-mono tabular-nums">
                  {formatDashboardNumber(stats.xp)} total
                </span>
              </div>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-2.5 border-t border-[var(--border-subtle)] pt-4">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <Trophy size={12} className="text-[var(--accent-strong)]" />
                Battles Won
              </div>
              <p className="mt-1 font-mono text-lg font-bold text-[var(--text-primary)]">
                {formatDashboardNumber(stats.battles_won)}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {stats.battles_played > 0
                  ? `${Math.round((stats.battles_won / stats.battles_played) * 100)}% win rate`
                  : "0 duels played"}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <Flame size={12} className="text-amber-400" />
                Best Streak
              </div>
              <p className="mt-1 font-mono text-lg font-bold text-[var(--text-primary)]">
                {stats.longest_streak}{" "}
                <span className="text-xs font-normal text-[var(--text-muted)]">
                  {stats.longest_streak === 1 ? "day" : "days"}
                </span>
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {stats.streak === 0
                  ? "Practice today to start streak"
                  : `${stats.streak} ${stats.streak === 1 ? "day" : "days"} active streak`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
