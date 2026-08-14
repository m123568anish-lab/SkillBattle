"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, Flame, Target, Sparkles, ArrowRight } from "lucide-react";
import RecommendationCard from "./RecommendationCard";
import { aiCoach } from "@/data/aiCoach";

export default function AICoach() {
  const router = useRouter();

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.07] to-black/20 p-8 md:p-12 shadow-[0_0_50px_rgba(139,92,246,0.1)] backdrop-blur-2xl"
        >
          {/* subtle grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-40 pointer-events-none" />

          <div className="grid gap-12 lg:grid-cols-2 relative z-10 items-center">
            {/* Left Column */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  <Bot className="text-white h-7 w-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-1">
                    AI Coach
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    {aiCoach.greeting}
                  </h2>
                </div>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-slate-200 mb-6">
                {aiCoach.title}
              </h3>

              <div className="space-y-4">
                {aiCoach.recommendations.map((item) => (
                  <RecommendationCard key={item} recommendation={item} />
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Weakness Card */}
              <div className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:bg-white/10 hover:border-red-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Weak Topic Detected
                  </span>
                  <Target className="h-5 w-5 text-red-400 group-hover:animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-white">{aiCoach.weakness}</h3>
              </div>

              {/* Accuracy Card */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Overall Accuracy
                  </span>
                  <span className="text-2xl font-black text-cyan-400">{aiCoach.accuracy}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800/80 overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${aiCoach.accuracy}%` }}
                    transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                  />
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-5">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col items-center justify-center text-center transition-all hover:bg-white/10 hover:border-orange-500/30">
                  <Flame className="mb-3 h-6 w-6 text-orange-400" />
                  <h3 className="text-3xl font-black text-white">{aiCoach.streak}</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Day Streak</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col items-center justify-center text-center transition-all hover:bg-white/10 hover:border-violet-500/30">
                  <Sparkles className="mb-3 h-6 w-6 text-violet-400" />
                  <h3 className="text-xl font-black text-white">{aiCoach.nextGoal}</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Next Goal</p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => router.push("/ai-coach")}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 py-4 text-base font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] hover:shadow-cyan-500/30"
              >
                <Bot className="h-5 w-5" />
                Start AI Coaching Session
                <ArrowRight className="ml-1 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}