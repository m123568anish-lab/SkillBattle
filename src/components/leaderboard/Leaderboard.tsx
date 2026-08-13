"use client";

import { motion } from "framer-motion";
import { Crown, Search, Globe } from "lucide-react";
import { leaderboard } from "@/data/leaderboard";
import LeaderboardRow from "./LeaderboardRow";
import { Input } from "@/components/ui/input";

export default function Leaderboard() {
  return (
    <section className="relative py-24 lg:py-32">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 flex justify-center pointer-events-none">
        <div className="h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[150px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 shadow-[0_0_15px_rgba(234,179,8,0.2)] mb-6">
            <Crown className="text-yellow-400 h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">
              Global Rankings
            </span>
          </div>

          <h2 className="text-4xl font-black text-white md:text-5xl lg:text-6xl tracking-tight leading-[1.1]">
            Compete With
            <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
              The Best Players
            </span>
          </h2>

          <p className="mt-6 text-base md:text-lg leading-relaxed text-slate-400 font-medium">
            Climb the leaderboard, increase your XP,
            maintain your streak, and become the next champion.
          </p>
        </motion.div>

        {/* Search */}
        <div className="mx-auto mb-12 max-w-xl">
          <div className="relative group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 opacity-20 blur-md transition-opacity group-hover:opacity-40" />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-cyan-400 transition-colors z-10" size={20} />
            <Input
              placeholder="Search player..."
              className="relative z-10 h-14 w-full rounded-2xl border-white/10 bg-[#070B14]/80 pl-14 pr-6 text-base text-white placeholder:text-slate-500 backdrop-blur-xl focus-visible:ring-1 focus-visible:ring-cyan-400/50"
            />
          </div>
        </div>

        {/* Top Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-pink-500/10 p-6 md:p-8 backdrop-blur-xl shadow-lg"
        >
          <div className="flex items-center gap-4 md:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
              <Globe className="text-white h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white">Worldwide Rankings</h3>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Updated every minute</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1.5 text-xs font-black uppercase text-green-400 shadow-inner">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> LIVE
          </span>
        </motion.div>

        {/* Players List */}
        <div className="space-y-4">
          {leaderboard.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <LeaderboardRow player={player} index={index} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}