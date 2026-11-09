"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

import DashboardHero from "@/components/dashboard/DashboardHero";
import StatsGrid from "@/components/dashboard/StatsGrid";
import { SpotlightCard } from "@/components/ui/spotlight";
import { StaggerContainer, StaggerItem } from "@/components/common/PageTransition";

import { Swords, Code2, Bot, Trophy, ArrowRight, Sparkles } from "lucide-react";

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
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const {
    dashboard,
    loading,
    isRefreshing,
    isFromCache,
    isStale,
    lastRefreshedAt,
    error,
    refresh,
  } = useDashboard();

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedCacheTime = mounted && lastRefreshedAt
    ? new Date(lastRefreshedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {error && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 px-6 text-sm">
            <div className="text-rose-300">
              <span className="font-semibold">{dashboard ? "Notice:" : "Error:"}</span>{" "}
              {dashboard
                ? `Live dashboard data could not be refreshed (${error}). Showing cached metrics${formattedCacheTime ? ` (last updated at ${formattedCacheTime})` : ""}.`
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

        {dashboard && (isFromCache || isStale) && !error && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            Cached dashboard data · last updated{formattedCacheTime ? ` at ${formattedCacheTime}` : " previously"}.
            {isRefreshing ? " Refreshing from the API..." : " This data is not a live refresh."}
          </div>
        )}

        {!error && isRefreshing && dashboard && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] px-1">
            <span className="inline-block h-2 w-2 animate-ping rounded-full bg-[var(--accent)]" />
            <span>Updating live dashboard metrics...</span>
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
          </>
        ) : loading ? (
          <DashboardPlaceholder minHeight="16rem" />
        ) : (
          <DashboardSectionError title="Live student statistics are unavailable" onRetry={refresh} />
        )}

        {/* Quick Action Arena Launchpad with Cursor-Responsive Spotlight Cards */}
        <StaggerContainer className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <SpotlightCard
              onClick={() => router.push("/battle")}
              className="group flex flex-col justify-between p-5 text-left h-full cursor-pointer hover:border-[var(--accent)]/50"
            >
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
                  Enter real-time 1v1 coding duels to climb the rank ladder.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-strong)]">
                Find Match <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </SpotlightCard>
          </StaggerItem>

          <StaggerItem>
            <SpotlightCard
              onClick={() => router.push("/campaign")}
              className="group flex flex-col justify-between p-5 text-left h-full cursor-pointer hover:border-[var(--accent-secondary)]/50"
            >
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
                  Skill Quest Map
                </h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                  Progress through DSA, OS, and DBMS stage challenges.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-secondary-strong)]">
                Continue Quest <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </SpotlightCard>
          </StaggerItem>

          <StaggerItem>
            <SpotlightCard
              onClick={() => router.push("/tasks")}
              className="group flex flex-col justify-between p-5 text-left h-full cursor-pointer hover:border-[var(--accent)]/50"
            >
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
                  Solve catalog problems across all topics with instant verdict.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-strong)]">
                Solve Code <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </SpotlightCard>
          </StaggerItem>

          <StaggerItem>
            <SpotlightCard
              onClick={() => router.push("/interview")}
              className="group flex flex-col justify-between p-5 text-left h-full cursor-pointer hover:border-[var(--status-info)]/50"
            >
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
                  Practice technical & behavioral rounds with AI evaluation.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--status-info)]">
                Start Session <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </SpotlightCard>
          </StaggerItem>
        </StaggerContainer>

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

function DashboardSectionError({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <section role="alert" className="flex min-h-48 flex-col justify-center rounded-3xl border border-rose-400/20 bg-rose-500/[0.06] p-6">
      <h2 className="text-lg font-bold text-rose-200">{title}</h2>
      <p className="mt-2 text-sm text-rose-200/70">Live data could not be loaded.</p>
      <button type="button" onClick={() => void onRetry()} className="mt-4 w-fit rounded-lg border border-rose-300/30 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-400/10">Retry</button>
    </section>
  );
}
