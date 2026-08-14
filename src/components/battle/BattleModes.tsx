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
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-500/10 px-5 py-2 text-[10px] font-black tracking-[0.2em] text-cyan-300 uppercase shadow-inner mb-6">
            Battle Modes
          </span>

          <h2 className="text-4xl font-black text-white md:text-5xl lg:text-6xl tracking-tight leading-[1.1]">
            Choose Your
            <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
              Battle Arena
            </span>
          </h2>

          <p className="mt-6 text-base md:text-lg leading-relaxed text-slate-400 font-medium">
            Pick your favorite technology, compete against real players,
            earn XP, unlock achievements, and climb the global leaderboard.
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