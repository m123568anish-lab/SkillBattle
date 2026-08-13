"use client";

import { motion } from "framer-motion";
import HeroActions from "./HeroActions";
import HeroStats from "./HeroStats";
import { Sparkles } from "lucide-react";

export default function HeroContent() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="max-w-3xl flex flex-col items-center text-center lg:items-start lg:text-left"
    >
      {/* Premium Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="inline-flex items-center gap-2.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)] mb-8"
      >
        <Sparkles className="h-4 w-4 text-cyan-400" />
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-300">
          The Next-Gen Coding Arena
        </span>
      </motion.div>

      {/* Main Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
        className="text-5xl font-black leading-[1.1] tracking-tight text-white md:text-7xl lg:text-[5.5rem]"
      >
        <span className="block text-slate-100">Learn. Battle.</span>
        <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(167,139,250,0.3)]">
          Dominate.
        </span>
      </motion.h1>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6 }}
        className="mt-8 max-w-xl text-base md:text-lg leading-relaxed text-slate-400 font-medium"
      >
        Transform placement preparation into a thrilling multiplayer experience. 
        Challenge students globally, level up your coding rank, and get instant 
        AI-powered feedback on your algorithmic skills.
      </motion.p>

      {/* Call to Action Buttons */}
      <HeroActions />

      {/* Trusted By Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="mt-14 flex flex-col sm:flex-row items-center gap-5 pt-8 border-t border-white/5 w-full justify-center lg:justify-start"
      >
        <div className="flex -space-x-4 hover:-space-x-2 transition-all duration-300">
          {[
            "bg-gradient-to-br from-cyan-400 to-blue-600",
            "bg-gradient-to-br from-violet-400 to-fuchsia-600",
            "bg-gradient-to-br from-pink-400 to-rose-600",
          ].map((bgClass, i) => (
            <div 
              key={i} 
              className={`h-12 w-12 rounded-full border-[3px] border-[#070B14] ${bgClass} shadow-lg`} 
            />
          ))}
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#070B14] bg-slate-800 text-xs font-black text-white shadow-lg backdrop-blur-sm relative z-10">
            10K+
          </div>
        </div>
        <div className="text-center sm:text-left">
          <h3 className="font-bold text-white text-sm">
            Trusted by Elite Students
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Leveling up their careers right now.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}