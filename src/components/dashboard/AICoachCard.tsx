"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, ArrowRight, Brain, Terminal } from "lucide-react";
import GradientButton from "@/components/ui/gradient-button";
import type { AIRecommendation } from "@/types/dashboard";

interface AICoachCardProps {
  recommendation: AIRecommendation;
}

export default function AICoachCard({ recommendation }: AICoachCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push("/career/mentor");
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="
        rounded-3xl
        border
        border-cyan-500/20
        bg-gradient-to-br
        from-cyan-500/5
        via-[#090D1A]
        to-violet-500/5
        p-8
        relative
        overflow-hidden
        shadow-2xl
        shadow-black/40
      "
    >
      <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-transparent p-3.5 border border-cyan-500/30 shadow-md shadow-cyan-500/5">
            <Bot size={28} className="text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">AI Placement Coach</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Real-time analysis & recommendations</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs text-cyan-300 font-bold uppercase tracking-widest">
          <Terminal size={12} /> Live
        </div>
      </div>

      <div className="relative z-10 mt-8 rounded-2xl border border-white/5 bg-[#0D1226]/50 p-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Brain className="text-cyan-400" size={20} />
          <span className="font-bold text-white text-base">
            {recommendation.title}
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-400 font-medium">
          {recommendation.message}
        </p>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider">
            <span className="text-slate-500">Skill Alignment</span>
            <span className="text-cyan-400">{recommendation.progress}%</span>
          </div>

          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${recommendation.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-8">
        <GradientButton onClick={handleClick}>
          <span className="font-bold flex items-center gap-2">
            {recommendation.action}
            <ArrowRight size={16} />
          </span>
        </GradientButton>
      </div>
    </motion.div>
  );
}