"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";

import DashboardHero from "@/components/dashboard/DashboardHero";

import AICoachCard from "@/components/dashboard/AICoachCard";
import DailyChallenge from "@/components/dashboard/DailyChallenge";

import StatsGrid from "@/components/dashboard/StatsGrid";
import WeeklyChart from "@/components/dashboard/WeeklyChart";

export default function DashboardPage() {
  return (
    <DashboardLayout>

      <DashboardHero />

      <div className="mt-8">

        <StatsGrid />

      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-2">

        <AICoachCard />

        <WeeklyChart />

      </div>

      <div className="mt-8">

        <DailyChallenge />

      </div>

    </DashboardLayout>
  );
}