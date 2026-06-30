"use client";

import { motion } from "framer-motion";
import { Crown, Search, Globe } from "lucide-react";

import { leaderboard } from "@/data/leaderboard";
import LeaderboardRow from "./LeaderboardRow";
import { Input } from "@/components/ui/input";

export default function Leaderboard() {
  return (
    <section className="relative py-32">

      {/* Background Glow */}

      <div className="absolute inset-0 -z-10 flex justify-center">

        <div className="h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[150px]" />

      </div>

      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-5 py-2">

            <Crown className="text-yellow-400" size={18} />

            <span className="text-sm font-semibold tracking-wide text-yellow-300">
              GLOBAL RANKINGS
            </span>

          </div>

          <h2 className="mt-8 text-5xl font-black text-white md:text-6xl">
            Compete With
            <span className="block bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-500 bg-clip-text text-transparent">
              The Best Players
            </span>
          </h2>

          <p className="mt-8 text-lg leading-8 text-slate-400">
            Climb the leaderboard, increase your XP,
            maintain your streak, and become the next champion.
          </p>

        </motion.div>

        {/* Search */}

        <div className="mx-auto mb-10 max-w-xl">

          <div className="relative">

            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={20}
            />

            <Input
              placeholder="Search player..."
              className="h-14 rounded-xl border-white/10 bg-white/5 pl-12 backdrop-blur-xl"
            />

          </div>

        </div>

        {/* Top Banner */}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="
            mb-10
            flex
            items-center
            justify-between
            rounded-2xl
            border
            border-cyan-500/20
            bg-gradient-to-r
            from-cyan-500/10
            via-violet-500/10
            to-pink-500/10
            p-6
          "
        >

          <div className="flex items-center gap-4">

            <Globe
              className="text-cyan-400"
              size={34}
            />

            <div>

              <h3 className="text-2xl font-bold text-white">
                Worldwide Rankings
              </h3>

              <p className="text-slate-400">
                Updated every minute
              </p>

            </div>

          </div>

          <span className="rounded-full bg-green-500/20 px-4 py-2 text-sm text-green-400">
            LIVE
          </span>

        </motion.div>

        {/* Players */}

        <div className="space-y-5">

          {leaderboard.map((player, index) => (

            <motion.div
              key={player.id}
              initial={{
                opacity: 0,
                y: 40,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.08,
              }}
            >
              <LeaderboardRow player={player} />
            </motion.div>

          ))}

        </div>

      </div>

    </section>
  );
}