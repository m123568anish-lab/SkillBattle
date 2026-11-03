"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Target, ArrowRight } from "lucide-react";
import GradientButton from "@/components/ui/gradient-button";
import BattleArenaCard from "./BattleArenaCard";
import LeaderboardWidget from "./LeaderboardWidget";
import AchievementWidget from "./AchievementWidget";
import CalendarHeatmap from "./CalendarHeatmap";
import type { DailyChallenge as DailyChallengeType } from "@/types/dashboard";

interface DailyChallengeProps {
  challenge: DailyChallengeType;
  activity?: Array<{ day: string; xp: number }>;
}

export default function DailyChallenge({ challenge, activity = [] }: DailyChallengeProps) {
  const router = useRouter();

  const handleStartChallenge = () => {
    router.push("/practice/tasks");
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="
        rounded-3xl
        border
        border-white/10
        bg-gradient-to-b
        from-white/5
        to-[#090D1A]/40
        p-8
        backdrop-blur-xl
        relative
        overflow-hidden
        shadow-2xl
        shadow-black/40
      "
    >
      <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-orange-500/5 blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-orange-500/20 to-transparent p-3.5 border border-orange-500/30 shadow-md shadow-orange-500/5">
            <Target size={28} className="text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Daily Coding Assignment</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Updates daily</p>
          </div>
        </div>
        {challenge.id !== "0" && challenge.is_completed && (
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300 font-bold">
            Completed today
          </span>
        )}
      </div>

      {/* Challenge Card */}
      <div className="mt-8 rounded-2xl border border-white/5 bg-[#0D1226]/50 p-6 backdrop-blur-md relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white tracking-tight">
            {challenge.id === "0" ? "No daily challenge available" : challenge.title}
          </h3>

          {challenge.id !== "0" && <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-400 capitalize">
            {challenge.difficulty}
          </span>}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-400 font-medium">
          {challenge.description}
        </p>

      </div>

      {/* Action Button */}
      <div className="mt-8 relative z-10">
        <GradientButton onClick={handleStartChallenge} disabled={challenge.id === "0"}>
          <span className="font-bold flex items-center gap-2">
            {challenge.id === "0" ? "Unavailable" : "View Daily Assignment"}
            <ArrowRight size={16} />
          </span>
        </GradientButton>
      </div>

      {/* Battle + Leaderboard Grid */}
      <div className="mt-12 grid gap-8 xl:grid-cols-2 relative z-10">
        <BattleArenaCard />
        <LeaderboardWidget />
      </div>

      {/* Calendar + Achievements Grid */}
      <div className="mt-8 grid gap-8 xl:grid-cols-2 relative z-10">
        <CalendarHeatmap activity={activity} />
        <AchievementWidget />
      </div>
    </motion.div>
  );
}
