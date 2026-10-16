"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GradientButton from '@/components/design/GradientButton';

import DashboardHero from "@/components/dashboard/DashboardHero";
import StatsGrid from "@/components/dashboard/StatsGrid";

import AICoachCard from "@/components/dashboard/AICoachCard";
import CommandCenterCard from "@/components/dashboard/CommandCenterCard";

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
const ServerStatus = dynamic(() => import("@/components/dashboard/ServerStatus"), {
  loading: () => <DashboardPlaceholder minHeight="18rem" />,
});

import { useDashboard } from "@/hooks/use-dashboard";
import { useAuthStore } from "@/store/authStore";
import { getPostLoginPath } from "@/lib/auth-routing";

function DeferredSection({ children, minHeight }: { children: ReactNode; minHeight: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (!("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldRender(true);
        observer.disconnect();
      }
    }, { rootMargin: "600px 0px" });

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} style={{ minHeight }}>
      {shouldRender ? children : <DashboardPlaceholder minHeight={minHeight} />}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);
  const [mounted, setMounted] = useState(false);
  const {
    dashboard,
    loading,
    isRefreshing,
    isFromCache,
    lastRefreshedAt,
    error,
    refresh,
  } = useDashboard();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    const destination = getPostLoginPath(user);
    if (destination !== "/dashboard") router.replace(destination);
  }, [authLoading, router, user]);

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

        <div className="mt-8">
          {dashboard?.command_center ? (
            <CommandCenterCard commandCenter={dashboard.command_center} />
          ) : (
            <div className="h-64 rounded-3xl bg-[#0a0f1d] border border-white/[0.06] animate-pulse p-6">
              <div className="h-6 w-48 rounded bg-white/[0.05] mb-4" />
              <div className="h-4 w-72 rounded bg-white/[0.03] mb-8" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-28 rounded-2xl bg-white/[0.02]" />
                <div className="h-28 rounded-2xl bg-white/[0.02]" />
                <div className="h-28 rounded-2xl bg-white/[0.02]" />
              </div>
            </div>
          )}
        </div>

        {/* AI Coach + Server Status Row */}
        <div className="mt-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {dashboard?.ai_recommendation ? (
              <AICoachCard
                recommendation={dashboard.ai_recommendation}
              />
            ) : (
              <div className="h-48 rounded-2xl bg-[#0a0f1d] border border-white/[0.06] animate-pulse p-6">
                <div className="h-6 w-40 rounded bg-white/[0.05] mb-3" />
                <div className="h-4 w-full rounded bg-white/[0.03] mb-2" />
                <div className="h-4 w-3/4 rounded bg-white/[0.03]" />
              </div>
            )}
            <DeferredSection minHeight="18rem">
              <ServerStatus />
            </DeferredSection>
          </div>
        </div>

        {/* Daily Challenge */}
        {dashboard?.daily_challenge && (
          <div className="mt-8">
            <DeferredSection minHeight="42rem">
              <DailyChallenge challenge={dashboard.daily_challenge} />
            </DeferredSection>
          </div>
        )}

        {/* Quick OA Placement Speedrun */}
        <div className="mt-8">
          <DeferredSection minHeight="10rem">
            <QuickSpeedrunWidget />
          </DeferredSection>
        </div>

        {/* Battle Dock */}
        <div className="mt-8">
          <DeferredSection minHeight="36rem">
            <BattleDock />
          </DeferredSection>
        </div>
      </div>
    </DashboardLayout>
  );
}
