"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GradientButton from '@/components/design/GradientButton';

import DashboardHero from "@/components/dashboard/DashboardHero";
import StatsGrid from "@/components/dashboard/StatsGrid";

import AICoachCard from "@/components/dashboard/AICoachCard";
import DailyChallenge from "@/components/dashboard/DailyChallenge";
import BattleDock from "@/components/dashboard/BattleDock";

import { useDashboard } from "@/hooks/use-dashboard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
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
  const {
    dashboard,
    loading,
    error,
    refresh,
  } = useDashboard();

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
      <motion.div
        initial={false}
        variants={containerVariants}
        animate="visible"
        className="space-y-8"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants}>
          <DashboardHero
            user={dashboard.user}
            stats={dashboard.stats}
          />
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="mt-8">
          <StatsGrid
            stats={dashboard.stats}
          />
        </motion.div>

        {/* AI Coach Card */}
        <motion.div variants={itemVariants} className="mt-8">
          <AICoachCard
            recommendation={dashboard.ai_recommendation}
          />
        </motion.div>

        {/* Daily Challenge */}
        <motion.div variants={itemVariants} className="mt-8">
          <DailyChallenge challenge={dashboard.daily_challenge} />
        </motion.div>

        {/* Battle Dock */}
        <motion.div variants={itemVariants} className="mt-8">
          <BattleDock />
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
