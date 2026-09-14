"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GradientButton from "@/components/design/GradientButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { DashboardHeroSkeleton, PanelSkeleton } from "@/components/ui/SkeletonCard";

import DashboardHero from "@/components/dashboard/DashboardHero";
import StatsGrid from "@/components/dashboard/StatsGrid";
import AICoachCard from "@/components/dashboard/AICoachCard";
import DailyChallenge from "@/components/dashboard/DailyChallenge";
import BattleDock from "@/components/dashboard/BattleDock";
import ServerStatus from "@/components/dashboard/ServerStatus";

import { useDashboard } from "@/hooks/use-dashboard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function DashboardPage() {
  const { dashboard, loading, error, refresh } = useDashboard();

  // ── Skeleton loading state — layout-stable, no spinner flash ──────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <DashboardHeroSkeleton />
          <div className="grid gap-6 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <PanelSkeleton key={i} rows={2} />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <PanelSkeleton rows={4} />
            <PanelSkeleton rows={4} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <motion.div
          className="flex h-[70vh] flex-col items-center justify-center gap-5"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold text-rose-400 mb-2">
              Unable to load dashboard
            </h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <GradientButton onClick={refresh}>Retry</GradientButton>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  if (!dashboard) return null;

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <ErrorBoundary label="Hero">
            <Suspense fallback={<DashboardHeroSkeleton />}>
              <DashboardHero user={dashboard.user} stats={dashboard.stats} />
            </Suspense>
          </ErrorBoundary>
        </motion.div>

        {/* ── Stats Grid ────────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <ErrorBoundary label="Stats">
            <Suspense fallback={<PanelSkeleton rows={1} />}>
              <StatsGrid stats={dashboard.stats} />
            </Suspense>
          </ErrorBoundary>
        </motion.div>

        {/* ── AI Coach + Server Status ──────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <div className="grid gap-6 lg:grid-cols-2">
            <ErrorBoundary label="AI Coach">
              <Suspense fallback={<PanelSkeleton rows={4} />}>
                <AICoachCard recommendation={dashboard.ai_recommendation} />
              </Suspense>
            </ErrorBoundary>
            <ErrorBoundary label="Server Status">
              <Suspense fallback={<PanelSkeleton rows={3} />}>
                <ServerStatus />
              </Suspense>
            </ErrorBoundary>
          </div>
        </motion.div>

        {/* ── Daily Challenge ───────────────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <ErrorBoundary label="Daily Challenge">
            <Suspense fallback={<PanelSkeleton rows={5} />}>
              <DailyChallenge challenge={dashboard.daily_challenge} />
            </Suspense>
          </ErrorBoundary>
        </motion.div>

        {/* ── Battle Dock ───────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <ErrorBoundary label="Battle Dock">
            <Suspense fallback={<PanelSkeleton rows={3} />}>
              <BattleDock />
            </Suspense>
          </ErrorBoundary>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
