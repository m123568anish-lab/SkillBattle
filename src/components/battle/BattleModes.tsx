"use client";

import { motion } from "framer-motion";

import BattleModeCard from "./BattleModeCard";
import { battleModes } from "@/data/battleModes";

export default function BattleModes() {
  return (
    <section className="relative py-32">

      <div className="mx-auto max-w-7xl px-6">

        {/* Section Heading */}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mx-auto mb-20 max-w-3xl text-center"
        >
          <span
            className="
              rounded-full
              border
              border-cyan-400/20
              bg-cyan-500/10
              px-5
              py-2
              text-sm
              font-semibold
              text-cyan-300
            "
          >
            BATTLE MODES
          </span>

          <h2 className="mt-8 text-5xl font-black text-white md:text-6xl">
            Choose Your
            <span className="block bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-500 bg-clip-text text-transparent">
              Battle Arena
            </span>
          </h2>

          <p className="mt-8 text-lg leading-8 text-slate-400">
            Pick your favorite technology, compete against real players,
            earn XP, unlock achievements and climb the global leaderboard.
          </p>
        </motion.div>

        {/* Cards */}

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {battleModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{
                opacity: 0,
                y: 50,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.12,
                duration: 0.5,
              }}
              viewport={{ once: true }}
            >
              <BattleModeCard mode={mode} />
            </motion.div>
          ))}
        </div>

      </div>

    </section>
  );
}