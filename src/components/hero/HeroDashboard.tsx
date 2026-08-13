"use client";

import { motion } from "framer-motion";
import { Clock3, Trophy, Zap, Swords, User } from "lucide-react";
import BattleProgress from "./BattleProgress";

export default function HeroDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
      transition={{
        opacity: { duration: 0.8, ease: "easeOut" },
        x: { duration: 0.8, ease: "easeOut" },
        y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
      }}
      className="relative w-full max-w-md lg:max-w-lg mt-10 lg:mt-0"
    >
      {/* Dynamic Glow */}
      <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-cyan-500/20 via-violet-500/30 to-fuchsia-500/20 blur-3xl" />

      {/* Main Glass Card */}
      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-black/20 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_60px_rgba(139,92,246,0.15)] overflow-hidden">
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-50" />

        <div className="relative z-10">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-inner">
                <Swords className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base tracking-wide">LIVE ARENA</h3>
                <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">DSA Challenge</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-[10px] sm:text-xs font-black text-rose-400 border border-rose-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
              LIVE
            </div>
          </div>

          {/* Versus Section */}
          <div className="mb-6 flex items-center justify-between relative">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg border border-white/20">
                <User className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white">Alex</h3>
              <p className="text-[10px] font-bold text-violet-300 uppercase tracking-widest">Lv. 24</p>
            </div>

            <div className="absolute left-1/2 top-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-black text-white shadow-xl backdrop-blur-md italic">
              VS
            </div>

            <div className="text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg border border-white/20">
                <User className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white">Rahul</h3>
              <p className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">Lv. 27</p>
            </div>
          </div>

          {/* Question & Timer */}
          <div className="mb-6 rounded-2xl border border-white/5 bg-black/40 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Problem</span>
                <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">HARD</span>
              </div>
              <h2 className="text-base font-bold text-white leading-tight">Reverse Linked List</h2>
            </div>
            
            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 border border-white/10 shrink-0">
              <Clock3 size={14} className="text-cyan-400" />
              <span className="font-mono text-sm font-bold text-cyan-400">01:42</span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-5">
            <BattleProgress title="Your Progress" value={78} />
            <BattleProgress title="Opponent Progress" value={91} color="from-rose-500 to-orange-500" />
          </div>

          {/* Footer Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-4 transition hover:bg-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy className="text-yellow-400" size={14} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rank</span>
              </div>
              <h3 className="text-2xl font-black text-white">#27</h3>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-4 transition hover:bg-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="text-violet-400" size={14} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">XP</span>
              </div>
              <h3 className="text-2xl font-black text-white">15K</h3>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}