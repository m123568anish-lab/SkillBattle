"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

import DashboardHero from "@/components/dashboard/DashboardHero";
import StatsGrid from "@/components/dashboard/StatsGrid";
import { SpotlightCard } from "@/components/ui/spotlight";
import { StaggerContainer, StaggerItem } from "@/components/common/PageTransition";

import { Swords, Code2, Bot, Trophy, ArrowRight } from "lucide-react";
import type { WeeklyActivity } from "@/types/dashboard";

function DashboardPlaceholder({ minHeight }: { minHeight: string }) {
  return <div aria-hidden="true" className="skeleton-shimmer rounded-2xl" style={{ minHeight }} />;
}

const DailyChallenge = dynamic(() => import("@/components/dashboard/DailyChallenge"), {
  loading: () => <DashboardPlaceholder minHeight="42rem" />,
});
const BattleDock = dynamic(() => import("@/components/dashboard/BattleDock"), {
  loading: () => <DashboardPlaceholder minHeight="36rem" />,
});
const QuickSpeedrunWidget = dynamic(() => import("@/components/dashboard/QuickSpeedrunWidget"), {
  loading: () => <DashboardPlaceholder minHeight="10rem" />,
});
const AICoachCard = dynamic(() => import("@/components/dashboard/AICoachCard"), {
  loading: () => <DashboardPlaceholder minHeight="12rem" />,
});
const CommandCenterCard = dynamic(() => import("@/components/dashboard/CommandCenterCard"), {
  loading: () => <DashboardPlaceholder minHeight="12rem" />,
});
const ServerStatus = dynamic(() => import("@/components/dashboard/ServerStatus"), {
  loading: () => <DashboardPlaceholder minHeight="18rem" />,
});

import { useDashboard } from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const {
    dashboard,
    loading,
    isRefreshing,
    error,
    refresh,
  } = useDashboard();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1440px] space-y-6 pb-4 sm:space-y-8">
        {error && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 px-6 text-sm">
            <div className="text-rose-300">
              <span className="font-semibold">{dashboard ? "Notice:" : "Error:"}</span>{" "}
              {dashboard
                ? `Live dashboard data could not be refreshed (${error}). Existing dashboard data is still available.`
                : `Live dashboard data could not be loaded (${error}).`}
            </div>
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-500/30 disabled:opacity-50"
            >
              {isRefreshing ? "Refreshing..." : "Retry"}
            </button>
          </div>
        )}

        {dashboard ? (
          <>
            <div>
              <DashboardHero
                user={dashboard.user}
                stats={dashboard.stats}
                achievements={dashboard.achievements}
              />
            </div>
            <div className="mt-8">
              <StatsGrid stats={dashboard.stats} />
            </div>
            <WeeklyActivityPanel activity={dashboard.weekly_activity} />
          </>
        ) : loading ? (
          <DashboardPlaceholder minHeight="16rem" />
        ) : (
          <DashboardSectionError title="Live student statistics are unavailable" onRetry={refresh} />
        )}

        <section aria-labelledby="dashboard-actions-title" className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Make your next move</p>
              <h2 id="dashboard-actions-title" className="mt-1 text-lg font-bold text-[var(--text-primary)]">Quick access</h2>
            </div>
            <Link href="/practice" className="inline-flex min-h-10 shrink-0 items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-strong)]">
              All learning <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <StaggerContainer className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StaggerItem>
            <SpotlightCard className="group h-full p-0 hover:border-[var(--accent)]/50">
              <Link href="/battle" className="flex h-full min-w-0 flex-col justify-between p-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--border-focus)] sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent-strong)] border border-[var(--accent)]/20">
                  <Swords className="h-5 w-5" />
                </div>
                <span className="flex items-center gap-1 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-strong)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-[live-ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  Live
                </span>
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-[var(--text-primary)] text-base group-hover:text-[var(--accent-strong)] transition-colors">
                  Battle Arena
                </h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                  Choose a solo challenge or explore available battle modes.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-strong)]">
                Explore Arena <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
              </Link>
            </SpotlightCard>
          </StaggerItem>

          <StaggerItem>
            <SpotlightCard className="group h-full p-0 hover:border-[var(--accent-secondary)]/50">
              <Link href="/campaign" className="flex h-full min-w-0 flex-col justify-between p-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--border-focus)] sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-secondary)]/15 text-[var(--accent-secondary-strong)] border border-[var(--accent-secondary)]/25">
                  <Trophy className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-[var(--accent-secondary)]/15 border border-[var(--accent-secondary)]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-secondary-strong)]">
                  Quest
                </span>
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-[var(--text-primary)] text-base group-hover:text-[var(--accent-secondary-strong)] transition-colors">
                  Learning Campaign
                </h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                  Continue through the available campaign stages.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-secondary-strong)]">
                Open Campaign <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
              </Link>
            </SpotlightCard>
          </StaggerItem>

          <StaggerItem>
            <SpotlightCard className="group h-full p-0 hover:border-[var(--accent)]/50">
              <Link href="/tasks" className="flex h-full min-w-0 flex-col justify-between p-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--border-focus)] sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]">
                  <Code2 className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-[var(--surface-elevated)] border border-[var(--border-default)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Catalog
                </span>
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-[var(--text-primary)] text-base group-hover:text-[var(--accent-strong)] transition-colors">
                  Practice Tasks
                </h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                  Practice with problems from the available catalog.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-strong)]">
                Solve Code <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
              </Link>
            </SpotlightCard>
          </StaggerItem>

          <StaggerItem>
            <SpotlightCard className="group h-full p-0 hover:border-[var(--status-info)]/50">
              <Link href="/interview" className="flex h-full min-w-0 flex-col justify-between p-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--border-focus)] sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--status-info)]/15 text-[var(--status-info)] border border-[var(--status-info)]/25">
                  <Bot className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-[var(--status-info)]/15 border border-[var(--status-info)]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--status-info)]">
                  AI Room
                </span>
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-[var(--text-primary)] text-base group-hover:text-[var(--status-info)] transition-colors">
                  Mock Interview
                </h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                  Open the interview practice experience.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--status-info)]">
                Explore Interviews <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
              </Link>
            </SpotlightCard>
          </StaggerItem>
          </StaggerContainer>
        </section>

        <div className="mt-8">
          {loading && !dashboard ? (
            <DashboardPlaceholder minHeight="16rem" />
          ) : error && !dashboard ? (
            <DashboardSectionError title="Command Center unavailable" onRetry={refresh} />
          ) : dashboard?.command_center ? (
            <CommandCenterCard commandCenter={dashboard.command_center} />
          ) : (
            <DashboardSectionEmpty title="Command Center is ready for more activity" detail="Complete a practice, assessment, or battle to generate personalized guidance." />
          )}
        </div>

        {/* AI Coach + Server Status Row */}
        <div className="mt-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {loading && !dashboard ? (
              <DashboardPlaceholder minHeight="12rem" />
            ) : error && !dashboard ? (
              <DashboardSectionError title="Coach recommendation unavailable" onRetry={refresh} />
            ) : dashboard?.ai_recommendation ? (
              <AICoachCard
                recommendation={dashboard.ai_recommendation}
              />
            ) : (
              <DashboardSectionEmpty title="Your coach will learn from your activity" detail="There is not enough evidence for a personalized recommendation yet." />
            )}
            <ServerStatus />
          </div>
        </div>

        {/* Daily Challenge */}
        {dashboard?.daily_challenge && (
          <div className="mt-8">
            <DailyChallenge challenge={dashboard.daily_challenge} activity={dashboard.weekly_activity} />
          </div>
        )}

        {/* Quick OA Placement Speedrun */}
        <div className="mt-8">
          <QuickSpeedrunWidget />
        </div>

        {/* Battle Dock */}
        <div className="mt-8">
          <BattleDock />
        </div>
      </div>
    </DashboardLayout>
  );
}

function DashboardSectionEmpty({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="flex min-h-48 flex-col justify-center rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-xl">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
      <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">{detail}</p>
    </section>
  );
}

function WeeklyActivityPanel({ activity }: { activity: WeeklyActivity[] }) {
  const totalXp = activity.reduce((total, item) => total + item.xp, 0);
  const peakXp = Math.max(1, ...activity.map((item) => item.xp));

  return (
    <section
      aria-labelledby="weekly-activity-title"
      className="grid gap-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 sm:p-5 lg:grid-cols-[minmax(12rem,0.7fr)_minmax(0,1.3fr)] lg:items-center"
    >
      <div className="flex items-start justify-between gap-4 lg:block">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Consistency</p>
          <h2 id="weekly-activity-title" className="mt-1 text-base font-bold text-[var(--text-primary)]">This week</h2>
        </div>
        <div className="text-right lg:mt-4 lg:text-left">
          <p className="font-mono text-xl font-bold text-[var(--accent-strong)]">{totalXp.toLocaleString()}</p>
          <p className="text-[11px] text-[var(--text-muted)]">XP earned</p>
        </div>
      </div>

      {activity.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border-default)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
          Weekly activity will appear here as you learn and practice.
        </p>
      ) : (
        <div className="grid grid-cols-7 gap-2 sm:gap-3" aria-label="Weekly XP activity">
          {activity.map((item, index) => {
            const height = item.xp > 0 ? Math.max(12, (item.xp / peakXp) * 100) : 4;
            return (
              <div key={`${item.day}-${index}`} className="flex min-w-0 flex-col items-center gap-2">
                <div className="flex h-20 w-full items-end justify-center rounded-md bg-[var(--surface-elevated)] p-1.5 sm:h-24">
                  <div
                    role="progressbar"
                    aria-label={`${item.day}: ${item.xp} XP`}
                    aria-valuenow={item.xp}
                    aria-valuemin={0}
                    aria-valuemax={peakXp}
                    className={`w-full max-w-8 rounded-sm ${item.xp > 0 ? "bg-[var(--accent)]" : "bg-[var(--border-default)]"}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="max-w-full truncate text-[10px] font-medium text-[var(--text-muted)]">
                  {item.day.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DashboardSectionError({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <section role="alert" className="flex min-h-48 flex-col justify-center rounded-3xl border border-rose-400/20 bg-rose-500/[0.06] p-6">
      <h2 className="text-lg font-bold text-rose-200">{title}</h2>
      <p className="mt-2 text-sm text-rose-200/70">Live data could not be loaded.</p>
      <button type="button" onClick={() => void onRetry()} className="mt-4 w-fit rounded-lg border border-rose-300/30 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-400/10">Retry</button>
    </section>
  );
}
