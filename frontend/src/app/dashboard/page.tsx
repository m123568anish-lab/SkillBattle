"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  Code2,
  Flame,
  Library,
  Mic,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHero from "@/components/dashboard/DashboardHero";
import DailyFocus from "@/components/dashboard/DailyFocus";
import LearningRoadmap from "@/components/dashboard/LearningRoadmap";
import StatsGrid from "@/components/dashboard/StatsGrid";
import { useDashboard } from "@/hooks/use-dashboard";
import type { DashboardStats, WeeklyActivity } from "@/types/dashboard";

function DashboardPlaceholder({ minHeight }: { minHeight: string }) {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)]"
      style={{ minHeight }}
    />
  );
}

const BattleDock = dynamic(() => import("@/components/dashboard/BattleDock"), {
  loading: () => <DashboardPlaceholder minHeight="19rem" />,
});
const LeaderboardWidget = dynamic(
  () => import("@/components/dashboard/LeaderboardWidget"),
  {
    loading: () => <DashboardPlaceholder minHeight="17rem" />,
  }
);
const AchievementWidget = dynamic(
  () => import("@/components/dashboard/AchievementWidget"),
  {
    loading: () => <DashboardPlaceholder minHeight="17rem" />,
  }
);
const QuickSpeedrunWidget = dynamic(
  () => import("@/components/dashboard/QuickSpeedrunWidget"),
  {
    loading: () => <DashboardPlaceholder minHeight="9rem" />,
  }
);
const AICoachCard = dynamic(
  () => import("@/components/dashboard/AICoachCard"),
  {
    loading: () => <DashboardPlaceholder minHeight="12rem" />,
  }
);
const ServerStatus = dynamic(
  () => import("@/components/dashboard/ServerStatus"),
  {
    loading: () => <DashboardPlaceholder minHeight="12rem" />,
  }
);

export default function DashboardPage() {
  const { dashboard, loading, isRefreshing, error, refresh } = useDashboard();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1440px] space-y-6 pb-6 sm:space-y-8">
        {error && (
          <div
            role="alert"
            className="flex flex-col justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.08] p-4 text-sm sm:flex-row sm:items-center shadow-lg"
          >
            <p className="text-rose-200">
              <span className="font-bold">
                {dashboard ? "Live sync alert:" : "Dashboard unavailable:"}
              </span>{" "}
              {dashboard
                ? `Live telemetry could not be updated (${error}). Cached data is shown.`
                : `Live dashboard data could not be fetched (${error}).`}
            </p>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={isRefreshing}
              className="min-h-10 shrink-0 rounded-xl border border-rose-300/30 bg-rose-500/20 px-4 text-xs font-bold text-rose-100 transition hover:bg-rose-500/30 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              {isRefreshing ? "Refreshing…" : "Retry Sync"}
            </button>
          </div>
        )}

        {dashboard ? (
          <>
            {/* Command Center Hero */}
            <DashboardHero
              user={dashboard.user}
              stats={dashboard.stats}
              learningGoal={dashboard.command_center?.roadmap?.title}
              nextAction={dashboard.command_center?.next_best_action?.title}
            />

            {/* Performance Metric Instruments */}
            <StatsGrid stats={dashboard.stats} />

            {/* Roadmap & Daily Focus Dual Columns */}
            <section
              aria-label="Roadmap and daily focus"
              className="grid items-stretch gap-6 xl:grid-cols-2"
            >
              <LearningRoadmap commandCenter={dashboard.command_center} />
              <DailyFocus
                challenge={dashboard.daily_challenge}
                commandCenter={dashboard.command_center}
              />
            </section>

            {/* Battle Arena Command Dock */}
            <BattleDock
              stats={dashboard.stats}
              recentActivity={dashboard.recent_activity}
            />

            {/* Weekly Consistency & Learning Pathways */}
            <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.7fr)]">
              <WeeklyActivityPanel
                activity={dashboard.weekly_activity}
                completedTasks={dashboard.stats.practice_completed}
                stats={dashboard.stats}
              />
              <ExploreLearning />
            </div>

            {/* Community, Leaderboard & Achievements */}
            <section
              aria-labelledby="community-progress-title"
              className="space-y-4"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  Community & Standings
                </p>
                <h2
                  id="community-progress-title"
                  className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)]"
                >
                  Global Standing & Badges
                </h2>
              </div>
              <div className="grid items-start gap-6 xl:grid-cols-2">
                <LeaderboardWidget />
                <AchievementWidget />
              </div>
            </section>

            {/* AI Skill Advisor & Platform Telemetry */}
            <div className="grid items-start gap-6 xl:grid-cols-2">
              {dashboard.ai_recommendation && (
                <AICoachCard recommendation={dashboard.ai_recommendation} />
              )}
              <ServerStatus />
            </div>

            {/* Placement Quick Speedrun */}
            <QuickSpeedrunWidget />
          </>
        ) : loading ? (
          <div className="space-y-6">
            <DashboardPlaceholder minHeight="18rem" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <DashboardPlaceholder minHeight="6rem" />
              <DashboardPlaceholder minHeight="6rem" />
              <DashboardPlaceholder minHeight="6rem" />
              <DashboardPlaceholder minHeight="6rem" />
              <DashboardPlaceholder minHeight="6rem" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <DashboardPlaceholder minHeight="14rem" />
              <DashboardPlaceholder minHeight="14rem" />
            </div>
          </div>
        ) : (
          <DashboardSectionError
            title="Live student telemetry is currently unavailable"
            onRetry={refresh}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function ExploreLearning() {
  const destinations = [
    {
      href: "/campaign",
      title: "Learning Campaign",
      detail: "Progress through structured campus learning stages.",
      icon: Trophy,
      accent: "text-[var(--accent-strong)]",
    },
    {
      href: "/tasks",
      title: "Problem Catalog",
      detail: "Curated DSA, System Design & Core CS tasks.",
      icon: Code2,
      accent: "text-emerald-400",
    },
    {
      href: "/interview",
      title: "AI Mock Interview",
      detail: "Practice live voice and coding interview rounds.",
      icon: Mic,
      accent: "text-amber-400",
    },
    {
      href: "/coach",
      title: "AI Skill Coach",
      detail: "Tailored debugging tips and concept explanations.",
      icon: Bot,
      accent: "text-cyan-400",
    },
    {
      href: "/practice/topics",
      title: "Curated Knowledge Base",
      detail: "Cheat sheets, interview guides and core topics.",
      icon: Library,
      accent: "text-violet-400",
    },
  ];

  return (
    <section className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-xl sm:p-7">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            <Sparkles size={11} className="text-[var(--accent-strong)]" />
            Career Accelerators
          </span>
        </div>
        <h2 className="mt-1.5 text-xl font-bold tracking-tight text-[var(--text-primary)]">
          Explore Learning Tracks
        </h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Specialized preparation tracks designed for top tech placement.
        </p>

        <div className="mt-4 divide-y divide-[var(--border-subtle)]">
          {destinations.map(({ href, title, detail, icon: Icon, accent }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-h-[4rem] items-center gap-3.5 py-3 first:pt-1 last:pb-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-all group-hover:border-[var(--accent)]/40 group-hover:scale-105">
                <Icon size={17} aria-hidden="true" className={accent} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-strong)] transition-colors">
                  {title}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-[var(--text-muted)]">
                  {detail}
                </span>
              </span>
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent-strong)]"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function WeeklyActivityPanel({
  activity,
  completedTasks,
  stats,
}: {
  activity: WeeklyActivity[];
  completedTasks: number;
  stats?: DashboardStats;
}) {
  const totalXp = activity.reduce((total, item) => total + item.xp, 0);
  const peakXp = Math.max(1, ...activity.map((item) => item.xp));
  const activeDays = activity.filter((item) => item.xp > 0 || item.is_active).length;
  const currentStreak = stats?.streak ?? 0;
  const longestStreak = stats?.longest_streak ?? currentStreak;
  const isActiveToday = Boolean(stats?.is_active_today);

  // Compute today's date in YYYY-MM-DD
  const todayIso = new Date().toISOString().slice(0, 10);

  const weekday = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    timeZone: "UTC",
  });

  return (
    <section
      aria-labelledby="weekly-activity-title"
      className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-xl sm:p-7"
    >
      <div>
        {/* Header Telemetry */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                <Flame size={11} className="text-amber-400" />
                Consistency & Day Streak
              </span>
            </div>
            <h2
              id="weekly-activity-title"
              className="mt-1.5 text-xl font-bold tracking-tight text-[var(--text-primary)]"
            >
              Weekly Velocity & Day Streak
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-right">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-left">
              <p className="font-mono text-base font-black tabular-nums text-amber-300 sm:text-lg flex items-center gap-1.5">
                <Flame size={14} className="text-amber-400 fill-amber-400/20" />
                {currentStreak}
                <span className="text-[10px] font-medium text-amber-400/80">
                  {currentStreak === 1 ? "day" : "days"}
                </span>
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-300/80">
                Day Streak
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-1.5 text-left">
              <p className="font-mono text-base font-black tabular-nums text-[var(--accent-strong)] sm:text-lg">
                {totalXp.toLocaleString()}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Weekly XP
              </p>
            </div>

            <div className="hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-1.5 text-left sm:block">
              <p className="font-mono text-base font-black tabular-nums text-[var(--text-primary)] sm:text-lg">
                {completedTasks.toLocaleString()}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Problems Solved
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Streak Status Notice */}
        <div
          role="status"
          className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs ${
            currentStreak > 0 && isActiveToday
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : currentStreak > 0
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
          }`}
        >
          <div className="shrink-0">
            {currentStreak > 0 && isActiveToday ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : currentStreak > 0 ? (
              <Flame size={16} className="text-amber-400 animate-pulse" />
            ) : (
              <Target size={16} className="text-[var(--accent-strong)]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-xs sm:text-sm">
              {currentStreak > 0 && isActiveToday
                ? `${currentStreak}-Day Streak Active for Today!`
                : currentStreak > 0
                ? `${currentStreak}-Day Streak at Risk!`
                : "Start Your Day Streak Today"}
            </p>
            <p className="mt-0.5 text-[11px] opacity-85 leading-relaxed">
              {currentStreak > 0 && isActiveToday
                ? "Qualifying activity recorded today. Your day streak is secured."
                : currentStreak > 0
                ? "Solve a challenge or compete in the arena today to maintain your streak."
                : "Complete today's daily focus challenge or an arena duel to begin your streak."}
            </p>
          </div>
        </div>

        {activity.length === 0 ? (
          <div className="mt-6 flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-8 text-center">
            <Flame className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="mt-2 text-sm font-bold text-[var(--text-primary)]">
              A fresh week begins here
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-[var(--text-muted)]">
              Solve problems or duel in the Battle Arena today to record your first XP streak.
            </p>
          </div>
        ) : (
          <div className="mt-6" role="group" aria-label="Daily XP and streak for the week">
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {activity.map((item, idx) => {
                const isDayActive = item.xp > 0 || Boolean(item.is_active);
                const isToday = item.day === todayIso || idx === activity.length - 1;
                const height =
                  item.xp > 0 ? Math.max(12, (item.xp / peakXp) * 100) : 4;
                const date = new Date(`${item.day}T00:00:00Z`);
                const dayLabel = Number.isNaN(date.getTime())
                  ? item.day
                  : weekday.format(date);

                return (
                  <div
                    key={item.day}
                    className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl p-1.5 transition-all ${
                      isToday
                        ? "border border-[var(--accent)]/30 bg-[var(--accent)]/[0.04]"
                        : "border border-transparent"
                    }`}
                  >
                    {/* Day Streak indicator node */}
                    <div className="flex h-5 items-center justify-center">
                      {isDayActive ? (
                        <span title="Qualifying streak activity logged">
                          <Flame size={13} className="text-amber-400 fill-amber-400/30" />
                        </span>
                      ) : isToday ? (
                        <span
                          title="Pending activity for today"
                          className="relative flex h-2 w-2"
                        >
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                        </span>
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--surface-subtle)]" />
                      )}
                    </div>

                    {/* XP Progress Bar */}
                    <div className="flex h-24 w-full items-end rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1.5 sm:h-28">
                      <div
                        role="progressbar"
                        aria-label={`${dayLabel} (${item.day}): ${item.xp} XP`}
                        aria-valuenow={item.xp}
                        aria-valuemin={0}
                        aria-valuemax={peakXp}
                        title={`${item.xp.toLocaleString()} XP`}
                        className={`w-full rounded-lg transition-all duration-300 ${
                          item.xp > 0
                            ? "bg-[var(--accent)] shadow-[0_0_10px_rgba(216,255,62,0.35)]"
                            : "bg-[var(--surface-subtle)]"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>

                    {/* Day Label & Telemetry */}
                    <div className="text-center">
                      <span
                        className={`block font-mono text-[10px] font-bold ${
                          isToday
                            ? "text-[var(--accent-strong)]"
                            : isDayActive
                            ? "text-[var(--text-primary)]"
                            : "text-[var(--text-muted)]"
                        }`}
                      >
                        {dayLabel}
                      </span>
                      <span className="block font-mono text-[9px] text-[var(--text-muted)]">
                        {isToday ? "Today" : item.xp > 0 ? `${item.xp}` : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Telemetry */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-muted)]">
              <span>
                <strong className="font-bold text-[var(--text-primary)]">
                  {activeDays}
                </strong>{" "}
                active {activeDays === 1 ? "day" : "days"} this week
              </span>
              <span className="font-mono text-[11px]">
                Streak: <strong className="text-amber-400">{currentStreak} {currentStreak === 1 ? "day" : "days"}</strong>
                {longestStreak > 0 && (
                  <span className="text-[var(--text-muted)]"> · Best: {longestStreak} {longestStreak === 1 ? "day" : "days"}</span>
                )}
              </span>
              <span className="font-mono font-bold text-[var(--accent-strong)]">
                Peak: {peakXp.toLocaleString()} XP/day
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function DashboardSectionError({
  title,
  onRetry,
}: {
  title: string;
  onRetry: () => void | Promise<void>;
}) {
  return (
    <section
      role="alert"
      className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-rose-400/25 bg-rose-500/[0.06] p-8 text-center"
    >
      <h2 className="text-xl font-bold text-rose-200">{title}</h2>
      <p className="mt-2 text-sm text-rose-200/70">
        Live data could not be retrieved from the server.
      </p>
      <button
        type="button"
        onClick={() => void onRetry()}
        className="mt-5 min-h-11 rounded-xl border border-rose-300/30 bg-rose-500/20 px-5 text-xs font-bold text-rose-100 transition hover:bg-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
      >
        Retry Connection
      </button>
    </section>
  );
}
