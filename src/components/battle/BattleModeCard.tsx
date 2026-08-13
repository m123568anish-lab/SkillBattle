"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Clock3, Star, ArrowRight } from "lucide-react";
import { BattleMode } from "@/data/battleModes";

interface BattleModeCardProps {
  mode: BattleMode;
}

export default function BattleModeCard({ mode }: BattleModeCardProps) {
  const router = useRouter();
  const Icon = mode.icon;

  return (
    <motion.div
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-colors hover:bg-white/10"
    >
      {/* Animated Glow Overlay */}
      <div className={`absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-r ${mode.gradient} opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40`} />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-30" />

      {/* Icon Area */}
      <div className="relative z-10 mb-6 flex items-start justify-between">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${mode.gradient} shadow-lg ring-1 ring-white/20`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-400 shadow-inner">
          {mode.difficulty}
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="relative z-10 mb-2 text-2xl font-black tracking-tight text-white">{mode.title}</h3>
      <p className="relative z-10 mb-8 flex-grow text-sm leading-relaxed text-slate-400">{mode.description}</p>

      {/* Stats row */}
      <div className="relative z-10 mb-6 flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/30 p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-1.5"><Users size={14} className="text-cyan-400" /> {mode.players.toLocaleString()} Online</div>
          <div className="flex items-center gap-1.5"><Clock3 size={14} className="text-violet-400" /> {mode.duration}</div>
        </div>
        <div className="h-[1px] w-full bg-white/5" />
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="text-slate-500 uppercase tracking-widest text-[10px]">Base Reward</span>
          <div className="flex items-center gap-1.5 text-yellow-400"><Star size={14} /> +{mode.xp} XP</div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => router.push("/battle/solo")}
        className="relative z-10 group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
      >
        Play Now
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
      </button>
    </motion.div>
  );
}