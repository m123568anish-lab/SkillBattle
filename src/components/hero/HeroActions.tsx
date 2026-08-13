"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Play, Zap } from "lucide-react";

export default function HeroActions() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
      className="mt-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 w-full justify-center lg:justify-start"
    >
      <button
        onClick={() => router.push("/battle")}
        className="group relative flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-8 text-base font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
      >
        <Zap className="h-5 w-5 fill-white text-white" />
        Start Free Battle
        <ArrowRight className="ml-1 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        
        {/* Shine effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
      </button>

      <button
        onClick={() => {
          const demoVideo = document.getElementById("demo-video");
          demoVideo?.scrollIntoView({ behavior: "smooth" });
        }}
        className="group flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-cyan-400/50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-cyan-500/20">
          <Play className="h-4 w-4 text-cyan-300" fill="currentColor" />
        </div>
        Watch Demo
      </button>
    </motion.div>
  );
}