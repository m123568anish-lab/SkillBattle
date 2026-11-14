"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Code2,
  Mic,
  Trophy,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHero from "@/components/dashboard/DashboardHero";
import DailyFocus from "@/components/dashboard/DailyFocus";
import LearningRoadmap from "@/components/dashboard/LearningRoadmap";
import StatsGrid from "@/components/dashboard/StatsGrid";
import { useDashboard } from "@/hooks/use-dashboard";
import type { WeeklyActivity } from "@/types/dashboard";

function DashboardPlaceholder({ minHeight }: { minHeight: string }) {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)]"
      style={{ minHeight }}
    />
  );
}

const BattleDock = dynamic(() => import("@/components/dashboard/BattleDock"), {
  loading: () => <DashboardPlaceholder minHeight="19rem" />,
});
const LeaderboardWidget = dynamic(() => import("@/components/dashboard/LeaderboardWidget"), {
  loading: () => <DashboardPlaceholder minHeight="17rem" />,
});
const AchievementWidget = dynamic(() => import("@/components/dashboard/AchievementWidget"), {
  loading: () => <DashboardPlaceholder minHeight="17rem" />,
});
const QuickSpeedrunWidget = dynamic(() => import("@/components/dashboard/QuickSpeedrunWidget"), {
  loading: () => <DashboardPlaceholder minHeight="9rem" />,
});
const AICoachCard = dynamic(() => import("@/components/dashboard/AICoachCard"), {
  loading: () => <DashboardPlaceholder minHeight="12rem" />,
});
const ServerStatus = dynamic(() => import("@/components/dashboard/ServerStatus"), {
  loading: () => <DashboardPlaceholder minHeight="12rem" />,
});

export default function DashboardPage() {
  const { dashboard, loading, isRefreshing, error, refresh } = useDashboard();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1440px] space-y-6 pb-4 sm:space-y-7">
        {error && (
          <div
            role="alert"
            className="flex flex-col justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] p-4 text-sm sm:flex-row sm:items-center"
          >
            <p className="text-rose-200">
              <span className="font-semibold">{dashboard ? "Refresh issue:" : "Dashboard unavailable:"}</span>{" "}
              {dashboard
                ? `Live dashboard data could not be refreshed (${error}). Previously loaded data remains available.`
                : `Live dashboard data could not be loaded (${error}).`}
            </p>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={isRefreshing}
              className="min-h-10 shrink-0 rounded-lg border border-rose-300/25 px-3 text-xs font-semibold text-rose-100 transition-colors hover:bg-rose-400/10 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              {isRefreshing ? "Refreshing…" : "Retry"}
            </button>
          </div>
        )}

        {dashboard ? (
          <>
            <DashboardHero
              user={dashboard.user}
              stats={dashboard.stats}
              learningGoal={dashboard.command_center?.roadmap?.title}
              nextAction={dashboard.command_center?.next_best_action?.title}
            />
            <StatsGrid stats={dashboard.stats} />
            <section aria-label="Roadmap and daily focus" className="grid items-start gap-4 xl:grid-cols-2">
              <LearningRoadmap commandCenter={dashboard.command_center} />
              <DailyFocus challenge={dashboard.daily_challenge} commandCenter={dashboard.command_center} />
            </section>

            <BattleDock stats={dashboard.stats} />

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
              <WeeklyActivityPanel activity={dashboard.weekly_activity} />
              <ExploreLearning />
            </div>

            <section aria-labelledby="community-progress-title" className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Your progress, in context
                </p>
                <h2 id="community-progress-title" className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                  Standing & achievements
                </h2>
              </div>
              <div className="grid items-start gap-5 xl:grid-cols-2">
                <LeaderboardWidget />
                <AchievementWidget />
              </div>
            </section>

            <div className="grid items-start gap-5 xl:grid-cols-2">
              {dashboard.ai_recommendation && (
                <AICoachCard recommendation={dashboard.ai_recommendation} />
              )}
              <ServerStatus />
            </div>

            <QuickSpeedrunWidget />
          </>
        ) : loading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <DashboardPlaceholder minHeight="15rem" />
            <DashboardPlaceholder minHeight="15rem" />
            <DashboardPlaceholder minHeight="10rem" />
          </div>
        ) : (
          <DashboardSectionError title="Live student statistics are unavailable" onRetry={refresh} />
        )}
      </div>
    </DashboardLayout>
  );
}

function ExploreLearning() {
  const destinations = [
    {
      href: "/campaign",
      title: "Learning campaign",
      detail: "Progress through available learning stages.",
      icon: Trophy,
    },
    {
      href: "/tasks",
      title: "Practice catalog",
      detail: "Choose a coding task from the catalog.",
      icon: Code2,
    },
    {
      href: "/interview",
      title: "Mock interview",
      detail: "Practice interview questions and responses.",
      icon: Mic,
    },
    {
      href: "/coach",
      title: "AI coach",
      detail: "Get support while you build your skills.",
      icon: Bot,
    },
  ];

  return (
    <section className="q-panel min-w-0 p-5 sm:p-6">
      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          More ways to grow
        </p>
        <h2 className="mt-1 text-base font-semibold text-[var(--text-primary)]">Explore learning</h2>
      </div>
      <div className="mt-3 divide-y divide-[var(--border-subtle)]">
        {destinations.map(({ href, title, detail, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-[4.25rem] items-center gap-3 py-3 first:pt-1 last:pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--border-focus)]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors group-hover:border-[var(--accent)]/40 group-hover:text-[var(--accent-strong)]">
              <Icon size={16} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--text-primary)]">{title}</span>
              <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{detail}</span>
            </span>
            <ArrowRight size={15} aria-hidden="true" className="shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent-strong)]" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function WeeklyActivityPanel({ activity }: { activity: WeeklyActivity[] }) {
  const totalXp = activity.reduce((total, item) => total + item.xp, 0);
  const peakXp = Math.max(1, ...activity.map((item) => item.xp));
  const activeDays = activity.filter((item) => item.xp > 0).length;
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" });

  return (
    <section
      aria-labelledby="weekly-activity-title"
      className="q-panel min-w-0 p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="q-kicker">Consistency</p>
          <h2 id="weekly-activity-title" className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
            Your weekly rhythm
          </h2>
        </div>
        <div className="text-right">
          <p className="font-mono text-xl font-semibold tabular-nums text-[var(--text-primary)]">
            {totalXp.toLocaleString()}
          </p>
          <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">XP this week</p>
        </div>
      </div>

      {activity.length === 0 || activeDays === 0 ? (
        <div className="mt-5 flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-6 text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">A fresh week starts here</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-[var(--text-muted)]">
            Your daily XP and learning consistency will show up as you practice.
          </p>
        </div>
      ) : (
        <div className="mt-5" role="group" aria-label="Daily XP for the week">
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {activity.map((item) => {
              const height = item.xp > 0 ? Math.max(8, (item.xp / peakXp) * 100) : 3;
              const date = new Date(`${item.day}T00:00:00Z`);
              const dayLabel = Number.isNaN(date.getTime()) ? item.day : weekday.format(date);
              return (
                <div key={item.day} className="flex min-w-0 flex-col items-center gap-2">
                  <div className="flex h-24 w-full items-end rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1.5 sm:h-28">
                    <div
                      role="progressbar"
                      aria-label={`${item.day}: ${item.xp} XP`}
                      aria-valuenow={item.xp}
                      aria-valuemin={0}
                      aria-valuemax={peakXp}
                      title={`${item.xp.toLocaleString()} XP`}
                      className={`w-full rounded-sm transition-[height] duration-300 motion-reduce:transition-none ${
                        item.xp > 0 ? "bg-[var(--accent)]" : "bg-[var(--border-default)]"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="max-w-full truncate text-[10px] font-medium text-[var(--text-muted)]">
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-primary)]">{activeDays}</span> active {activeDays === 1 ? "day" : "days"} from {activity.length} recorded
          </p>
        </div>
      )}
    </section>
  );
}

function DashboardSectionError({ title, onRetry }: { title: string; onRetry: () => void | Promise<void> }) {
  return (
    <section role="alert" className="flex min-h-48 flex-col justify-center rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-6">
      <h2 className="text-lg font-semibold text-rose-200">{title}</h2>
      <p className="mt-2 text-sm text-rose-200/70">Live data could not be loaded.</p>
      <button
        type="button"
        onClick={() => void onRetry()}
        className="mt-4 min-h-10 w-fit rounded-lg border border-rose-300/30 px-3 text-xs font-semibold text-rose-100 transition-colors hover:bg-rose-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
      >
        Retry
      </button>
    </section>
  );
}
