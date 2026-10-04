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
  const {
    dashboard,
    loading,
    error,
    refresh,
  } = useDashboard();

  useEffect(() => {
    if (authLoading || !user) return;
    const destination = getPostLoginPath(user);
    if (destination !== "/dashboard") router.replace(destination);
  }, [authLoading, router, user]);

  if (loading) {
    return (
      <DashboardLayout>
        <motion.div
          className="flex h-[70vh] items-center justify-center"
          initial={false}
          animate={{ opacity: 1 }}
        >
          <div className="text-center">
            <div className="mx-auto h-16 w-16 mb-6">
              <div className="relative h-full w-full">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-violet-500 border-b-transparent border-l-transparent animate-spin" />
              </div>
            </div>
            <p className="text-slate-400 font-semibold">
              Loading your dashboard...
            </p>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <motion.div
          className="flex h-[70vh] flex-col items-center justify-center gap-5"
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center">
            <h2 className="text-2xl font-bold text-rose-400 mb-2">
              Unable to load dashboard
            </h2>
            <p className="text-slate-400 mb-6">
              {error}
            </p>
            <GradientButton onClick={refresh}>Retry</GradientButton>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div>
          <DashboardHero
            user={dashboard.user}
            stats={dashboard.stats}
            achievements={dashboard.achievements}
          />
        </div>

        {/* Stats Grid */}
        <div className="mt-8">
          <StatsGrid
            stats={dashboard.stats}
          />
        </div>

        {/* AI Coach + Server Status Row */}
        <div className="mt-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <AICoachCard
              recommendation={dashboard.ai_recommendation}
            />
            <DeferredSection minHeight="18rem">
              <ServerStatus />
            </DeferredSection>
          </div>
        </div>

        {/* Daily Challenge */}
        <div className="mt-8">
          <DeferredSection minHeight="42rem">
          <DailyChallenge challenge={dashboard.daily_challenge} />
          </DeferredSection>
        </div>

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
