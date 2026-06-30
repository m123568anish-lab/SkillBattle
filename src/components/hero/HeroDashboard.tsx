"use client";

import { motion } from "framer-motion";
import {
  Clock3,
  Trophy,
  Zap,
  Swords,
} from "lucide-react";

import BattleProgress from "./BattleProgress";

export default function HeroDashboard() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 60,
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: [0, -12, 0],
      }}
      transition={{
        opacity: {
          duration: 0.8,
        },
        x: {
          duration: 0.8,
        },
        y: {
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
      className="relative w-full max-w-lg"
    >
      {/* Glow */}
      <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-pink-500/20 blur-3xl" />

      {/* Card */}
      <div
        className="
        relative
        rounded-3xl
        border
        border-white/10
        bg-white/5
        p-8
        backdrop-blur-2xl
        shadow-[0_0_80px_rgba(34,211,238,.12)]
      "
      >
        {/* Header */}

        <div className="mb-8 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-cyan-500/20 p-3">
              <Swords className="text-cyan-400" />
            </div>

            <div>
              <h3 className="font-bold text-white">
                LIVE BATTLE
              </h3>

              <p className="text-sm text-slate-400">
                DSA Arena
              </p>
            </div>

          </div>

          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
            LIVE
          </span>

        </div>

        {/* Players */}

        <div className="mb-8 flex items-center justify-between">

          {/* Player */}

          <div className="text-center">

            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xl font-bold shadow-lg">
              M
            </div>

            <h3 className="font-semibold text-white">
              Manish
            </h3>

            <p className="text-sm text-slate-400">
              Level 24
            </p>

          </div>

          {/* VS */}

          <div className="text-center">

            <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-5 py-2 text-xl font-black text-cyan-400">
              VS
            </div>

          </div>

          {/* Opponent */}

          <div className="text-center">

            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xl font-bold shadow-lg">
              R
            </div>

            <h3 className="font-semibold text-white">
              Rahul
            </h3>

            <p className="text-sm text-slate-400">
              Level 27
            </p>

          </div>

        </div>

        {/* Question */}

        <div className="mb-8 rounded-2xl border border-white/10 bg-slate-900/60 p-5">

          <div className="mb-2 flex items-center justify-between">

            <span className="text-sm text-slate-400">
              Current Challenge
            </span>

            <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-400">
              HARD
            </span>

          </div>

          <h2 className="text-xl font-bold text-white">
            Reverse Linked List
          </h2>

        </div>

        {/* Timer */}

        <div className="mb-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4">

          <div className="flex items-center gap-3">

            <Clock3
              size={20}
              className="text-cyan-400"
            />

            <span className="text-slate-300">
              Time Left
            </span>

          </div>

          <span className="text-2xl font-bold text-cyan-400">
            01:42
          </span>

        </div>

        {/* Progress */}

        <div className="space-y-6">

          <BattleProgress
            title="Your Progress"
            value={78}
          />

          <BattleProgress
            title="Opponent Progress"
            value={91}
            color="from-pink-500 to-orange-500"
          />

        </div>

        {/* Footer */}

        <div className="mt-8 grid grid-cols-2 gap-5">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="mb-3 flex items-center gap-2">

              <Trophy
                className="text-yellow-400"
                size={20}
              />

              <span className="text-sm text-slate-400">
                Rank
              </span>

            </div>

            <h3 className="text-3xl font-bold text-white">
              #27
            </h3>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="mb-3 flex items-center gap-2">

              <Zap
                className="text-violet-400"
                size={20}
              />

              <span className="text-sm text-slate-400">
                XP
              </span>

            </div>

            <h3 className="text-3xl font-bold text-white">
              15,420
            </h3>

          </div>

        </div>

      </div>

    </motion.div>
  );
}