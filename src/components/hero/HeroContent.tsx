"use client";

import { motion } from "framer-motion";
import HeroActions from "./HeroActions";
import HeroStats from "./HeroStats";

export default function HeroContent() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className="max-w-2xl"
    >
      {/* Badge */}

      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 backdrop-blur-xl"
      >
        <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-400" />

        <span className="text-sm font-medium tracking-wide text-cyan-300">
          INDIA'S NEXT GENERATION LEARNING PLATFORM
        </span>
      </motion.div>

      {/* Heading */}

      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.7,
        }}
        className="mt-10 text-5xl font-black leading-[1.05] tracking-tight text-white md:text-7xl"
      >
        Battle.

        <br />

        Learn.

        <br />

        <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-500 bg-clip-text text-transparent">
          Dominate.
        </span>
      </motion.h1>

      {/* Description */}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: 0.45,
        }}
        className="mt-8 max-w-xl text-lg leading-8 text-slate-400"
      >
        SkillBattle transforms placement preparation into a competitive
        multiplayer experience. Challenge real students, earn XP,
        unlock achievements, and receive AI-powered feedback after
        every battle.
      </motion.p>

      {/* Buttons */}

      <HeroActions />

      {/* Trusted By */}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: 0.7,
        }}
        className="mt-10 flex flex-wrap items-center gap-5"
      >
        <div className="flex -space-x-3">
          <div className="h-11 w-11 rounded-full border-2 border-[#070B14] bg-cyan-500" />

          <div className="h-11 w-11 rounded-full border-2 border-[#070B14] bg-violet-500" />

          <div className="h-11 w-11 rounded-full border-2 border-[#070B14] bg-pink-500" />

          <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#070B14] bg-slate-800 text-sm font-bold text-white">
            +7K
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-white">
            Trusted by 10,000+ Students
          </h3>

          <p className="text-sm text-slate-400">
            Preparing for placements every day
          </p>
        </div>
      </motion.div>

      {/* Stats */}

      <HeroStats />
    </motion.div>
  );
}