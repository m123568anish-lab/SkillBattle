"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

import DashboardHero from "@/components/dashboard/DashboardHero";
import StatsGrid from "@/components/dashboard/StatsGrid";

import { Swords, Code2, Bot, Trophy, ArrowRight, Sparkles } from "lucide-react";

function DashboardPlaceholder({ minHeight }: { minHeight: string }) {
  return <div aria-hidden="true" className="animate-pulse rounded-2xl bg-white/[0.02]" style={{ minHeight }} />;
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
import { useAuthStore } from "@/store/authStore";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);
  const {
    dashboard,
    loading,
    isRefreshing,
    lastRefreshedAt,
    error,
    refresh,
  } = useDashboard();

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultStats = {
    xp: 0,
    level: user?.level ?? 1,
    streak: 0,
    rating: 1000,
    battles_played: 0,
    battles_won: 0,
  };

  const activeStats = dashboard?.stats ?? defaultStats;
  const activeUser = dashboard?.user ?? {
    id: user?.id ?? "",
    username: user?.username ?? "player",
    full_name: user?.full_name ?? user?.username ?? "SkillBattle Player",
    email: user?.email ?? "",
    avatar_url: user?.avatar_url ?? null,
    role: user?.role ?? "user",
    is_superuser: Boolean(user?.is_superuser),
  };

  const formattedCacheTime = mounted && lastRefreshedAt
    ? ` from ${new Date(lastRefreshedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
    : "";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {error && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 px-6 text-sm">
            <div className="text-rose-300">
              <span className="font-semibold">{dashboard ? "Notice:" : "Error:"}</span>{" "}
              {dashboard
                ? `Live dashboard data could not be refreshed (${error}). Showing cached metrics${formattedCacheTime}.`
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

        {!error && isRefreshing && dashboard && (
          <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
            <span className="inline-block h-2 w-2 animate-ping rounded-full bg-cyan-400" />
            <span>Updating live dashboard metrics...</span>
          </div>
        )}

        {/* Hero Section */}
        <div>
          <DashboardHero
            user={activeUser}
            stats={activeStats}
            achievements={dashboard?.achievements ?? []}
          />
        </div>

        {/* Stats Grid */}
        <div className="mt-8">
          <StatsGrid
            stats={activeStats}
          />
        </div>

        {/* Quick Action Arena Launchpad */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => router.push("/battle")}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-[#0a0f1d] to-[#050816] p-5 text-left transition hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
                <Swords className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">Live</span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">Battle Arena</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">Enter real-time 1v1 coding duels to climb the rank ladder.</p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              Find Match <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          <button
            onClick={() => router.push("/campaign")}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-[#0a0f1d] to-[#050816] p-5 text-left transition hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20">
                <Trophy className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">Quest</span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition-colors">Skill Quest Map</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">Progress through DSA, OS, and DBMS stage challenges.</p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              Continue Quest <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          <button
            onClick={() => router.push("/tasks")}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-[#0a0f1d] to-[#050816] p-5 text-left transition hover:border-violet-400/50 hover:shadow-lg hover:shadow-violet-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300 ring-1 ring-violet-400/20">
                <Code2 className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">500+</span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-white text-base group-hover:text-violet-300 transition-colors">Practice Tasks</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">Solve catalog problems across all topics with instant verdict.</p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-violet-400">
              Solve Code <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          <button
            onClick={() => router.push("/interview")}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-[#0a0f1d] to-[#050816] p-5 text-left transition hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
                <Bot className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">AI Room</span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-white text-base group-hover:text-emerald-300 transition-colors">Mock Interview</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">Practice technical & behavioral rounds with AI evaluation.</p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              Start Session <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          <button
            onClick={() => router.push("/challenge")}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-[#0a0f1d] to-[#050816] p-5 text-left transition hover:border-orange-400/50 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400/10 text-orange-300 ring-1 ring-orange-400/20"><Sparkles className="h-5 w-5" /></div>
            <div className="mt-4"><h3 className="font-bold text-white text-base group-hover:text-orange-300 transition-colors">Daily Challenge</h3><p className="mt-1 text-xs text-slate-400 leading-relaxed">Take today&apos;s focused challenge and keep your learning rhythm going.</p></div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-orange-400">Open challenge <ArrowRight className="h-3.5 w-3.5" /></div>
          </button>

          <button
            onClick={() => router.push("/coach")}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-[#0a0f1d] to-[#050816] p-5 text-left transition hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20"><Bot className="h-5 w-5" /></div>
            <div className="mt-4"><h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">AI Coach</h3><p className="mt-1 text-xs text-slate-400 leading-relaxed">Review your next recommendation using your real learning activity.</p></div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-cyan-400">Meet your coach <ArrowRight className="h-3.5 w-3.5" /></div>
          </button>
        </div>

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
    <section className="flex min-h-48 flex-col justify-center rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="mt-2 max-w-xl text-sm text-slate-400">{detail}</p>
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
