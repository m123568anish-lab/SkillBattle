"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Target, ArrowRight, Zap, ShieldAlert } from "lucide-react";
import GradientButton from "@/components/ui/gradient-button";
import BattleArenaCard from "./BattleArenaCard";
import LeaderboardWidget from "./LeaderboardWidget";
import AchievementWidget from "./AchievementWidget";
import CalendarHeatmap from "./CalendarHeatmap";
import type { DailyChallenge as DailyChallengeType } from "@/types/dashboard";

interface DailyChallengeProps {
  challenge: DailyChallengeType;
}

export default function DailyChallenge({ challenge }: DailyChallengeProps) {
  const router = useRouter();

  const handleStartChallenge = () => {
    router.push("/challenge");
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
            <h2 className="text-2xl font-black text-white">Daily Coding Mission</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Expires in 24 Hours</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 text-xs text-orange-300 font-bold uppercase tracking-widest">
          <ShieldAlert size={12} /> High Priority
        </div>
      </div>

      {/* Challenge Card */}
      <div className="mt-8 rounded-2xl border border-white/5 bg-[#0D1226]/50 p-6 backdrop-blur-md relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white tracking-tight">
            {challenge.title}
          </h3>

          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-400 capitalize">
            {challenge.difficulty}
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-400 font-medium">
          {challenge.description}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <div className="rounded-lg bg-yellow-400/10 border border-yellow-400/20 p-1.5">
            <Zap size={18} className="text-yellow-400 animate-bounce" />
          </div>
          <span className="font-bold text-yellow-400 text-sm">
            +{challenge.xp_reward} XP Reward on Completion
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-8 relative z-10">
        <GradientButton onClick={handleStartChallenge}>
          <span className="font-bold flex items-center gap-2">
            Accept Mission
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
        <CalendarHeatmap />
        <AchievementWidget />
      </div>
    </motion.div>
  );
}