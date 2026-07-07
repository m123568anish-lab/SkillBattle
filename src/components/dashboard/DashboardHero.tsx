"use client";

import { motion } from "framer-motion";

import {
  Flame,
  Trophy,
  Star,
  Target,
} from "lucide-react";

import XPProgress from "./XPProgress";

export default function DashboardHero() {
  const hour = new Date().getHours();

  let greeting = "Good Evening";

  if (hour < 12) greeting = "Good Morning";
  else if (hour < 18) greeting = "Good Afternoon";

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 25,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.6,
      }}
      className="
        rounded-3xl
        border
        border-white/10
        bg-gradient-to-br
        from-cyan-500/10
        via-slate-900
        to-violet-500/10
        p-8
      "
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">

        {/* Left */}

        <div>

          <p className="text-lg text-slate-400">
            {greeting},
          </p>

          <h1 className="mt-2 text-5xl font-black text-white">
            Manish 👋
          </h1>

          <p className="mt-4 max-w-xl text-slate-400">
            Welcome back! Continue your preparation and
            move one step closer to your dream company.
          </p>

          <XPProgress
            currentXP={18450}
            nextLevelXP={25000}
          />

        </div>

        {/* Right */}

        <div className="grid gap-5 sm:grid-cols-2">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <Star className="mb-3 text-yellow-400" />

            <p className="text-sm text-slate-400">
              Level
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              12
            </h2>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <Flame className="mb-3 text-orange-400" />

            <p className="text-sm text-slate-400">
              Daily Streak
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              24 Days
            </h2>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <Trophy className="mb-3 text-cyan-400" />

            <p className="text-sm text-slate-400">
              Global Rank
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              #482
            </h2>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <Target className="mb-3 text-green-400" />

            <p className="text-sm text-slate-400">
              Daily Goal
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              80%
            </h2>

          </div>

        </div>

      </div>
    </motion.section>
  );
}