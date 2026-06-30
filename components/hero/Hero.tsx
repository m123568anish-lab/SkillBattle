"use client";

import GridBackground from "@/components/background/GridBackground";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Trophy, Flame, Users } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <GridBackground />

      <div className="mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-between gap-16 px-6 py-20 lg:flex-row">

        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-400">
            🚀 India's Competitive Learning Platform
          </span>

          <h1 className="mt-8 text-5xl font-extrabold leading-tight text-white lg:text-7xl">
            Battle Your Skills
            <br />
            <span className="text-cyan-400">
              Against The World
            </span>
          </h1>

          <p className="mt-8 text-lg leading-8 text-slate-300">
            Challenge students in real-time coding battles,
            level up your skills, climb leaderboards,
            and prepare for placements like never before.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button
              size="lg"
              className="bg-violet-600 hover:bg-violet-700"
            >
              Start Battle
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8">
            <div>
              <Users className="mb-3 text-cyan-400" />
              <h3 className="text-3xl font-bold text-white">
                10K+
              </h3>
              <p className="text-slate-400">
                Players
              </p>
            </div>

            <div>
              <Trophy className="mb-3 text-yellow-400" />
              <h3 className="text-3xl font-bold text-white">
                250K+
              </h3>
              <p className="text-slate-400">
                Battles
              </p>
            </div>

            <div>
              <Flame className="mb-3 text-red-400" />
              <h3 className="text-3xl font-bold text-white">
                98%
              </h3>
              <p className="text-slate-400">
                Win Rate
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-center"
        >
          <div className="flex h-[450px] w-[450px] items-center justify-center rounded-full border border-cyan-400/20 bg-gradient-to-br from-violet-600/20 to-cyan-500/20 shadow-[0_0_100px_rgba(34,211,238,0.25)]">
            <span className="text-center text-3xl font-bold text-white">
              ⚔
              <br />
              Battle Arena
            </span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}