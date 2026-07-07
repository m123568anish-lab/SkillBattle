"use client";

import { motion } from "framer-motion";
import {
  Target,
  ArrowRight,
  Zap,
} from "lucide-react";

import GradientButton from "@/components/ui/gradient-button";
import LeaderboardWidget from "./LeaderboardWidget";
import BattleArenaCard from "./BattleArenaCard";
import AchievementWidget from "./AchievementWidget";
import CalendarHeatmap from "./CalendarHeatmap";

export default function DailyChallenge() {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="
        rounded-3xl
        border
        border-white/10
        bg-white/5
        p-8
      "
    >
      <div className="flex items-center gap-4">

        <div className="rounded-2xl bg-orange-500/20 p-4">

          <Target
            size={30}
            className="text-orange-400"
          />

        </div>

        <div>

          <h2 className="text-2xl font-black text-white">
            Today's Challenge
          </h2>

          <p className="text-slate-400">
            Daily coding mission
          </p>

        </div>

      </div>

      <div className="mt-8 rounded-2xl bg-white/5 p-6">

        <div className="flex items-center justify-between">

          <h3 className="text-xl font-bold text-white">
            Two Sum
          </h3>

          <span className="rounded-full bg-green-500/20 px-3 py-1 text-green-300">
            Easy
          </span>

        </div>

        <p className="mt-4 text-slate-400">
          Solve today's challenge to earn XP
          and maintain your daily streak.
        </p>

        <div className="mt-6 flex items-center gap-3">

          <Zap
            size={20}
            className="text-yellow-400"
          />

          <span className="font-semibold text-yellow-300">
            +20 XP Reward
          </span>

        </div>

      </div>

      <div className="mt-8">

        <GradientButton>

          Start Challenge

          <ArrowRight
            size={18}
            className="ml-2"
          />

        </GradientButton>

      </div><div className="mt-8 grid gap-8 xl:grid-cols-2">

        <BattleArenaCard />

         <LeaderboardWidget />

      </div>
      <div className="mt-8 grid gap-8 xl:grid-cols-2">

      <CalendarHeatmap />

      <AchievementWidget />

    </div>

    </motion.div>
  );
}