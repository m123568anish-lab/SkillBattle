"use client";

import { motion } from "framer-motion";

interface Props {
  currentXP: number;
  nextLevelXP: number;
}

export default function XPProgress({
  currentXP,
  nextLevelXP,
}: Props) {
  const percentage = Math.min(
    (currentXP / nextLevelXP) * 100,
    100
  );

  const radius = 38;
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-xl">
      <div className="relative flex items-center justify-center h-24 w-24">
        {/* Glowing aura background for ring */}
        <div className="absolute inset-2 rounded-full bg-cyan-500/10 blur-md animate-pulse" />
        
        <svg className="h-24 w-24 transform -rotate-90">
          <circle cx="48" cy="48" r={radius} className="stroke-white/10 fill-none stroke-[6px]" />
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-cyan-500 fill-none stroke-[6px] stroke-linecap-round"
            initial={{ strokeDashoffset: strokeDasharray }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ strokeDasharray }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-lg font-black text-white">{Math.round(percentage)}%</span>
          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">XP</span>
        </div>
      </div>
      <div className="text-center sm:text-left">
        <h4 className="font-bold text-white text-base">Progress to Next Level</h4>
        <p className="text-sm text-slate-400 mt-1">
          <span className="text-cyan-400 font-bold">{currentXP} XP</span> / {nextLevelXP} XP
        </p>
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs text-cyan-300 font-bold">
          ⚡ Level Up Quest Active
        </div>
      </div>
    </div>
  );
}