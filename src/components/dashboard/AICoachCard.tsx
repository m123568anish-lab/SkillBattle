"use client";

import { motion } from "framer-motion";
import { Bot, ArrowRight, Brain } from "lucide-react";

import GradientButton from "@/components/ui/gradient-button";

export default function AICoachCard() {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="
        rounded-3xl
        border
        border-cyan-500/20
        bg-gradient-to-br
        from-cyan-500/10
        via-slate-900
        to-violet-500/10
        p-8
      "
    >
      <div className="flex items-center gap-4">

        <div className="rounded-2xl bg-cyan-500/20 p-4">
          <Bot
            size={34}
            className="text-cyan-400"
          />
        </div>

        <div>

          <h2 className="text-2xl font-black text-white">
            AI Coach
          </h2>

          <p className="text-slate-400">
            Personalized recommendation
          </p>

        </div>

      </div>

      <div className="mt-8 rounded-2xl bg-white/5 p-6">

        <div className="flex items-center gap-3">

          <Brain
            className="text-cyan-400"
            size={22}
          />

          <span className="font-semibold text-white">
            Continue Graph Preparation
          </span>

        </div>

        <p className="mt-4 leading-7 text-slate-400">
          Based on your recent progress,
          mastering Graph algorithms will
          improve your interview readiness
          for Google, Amazon and Microsoft.
        </p>

        <div className="mt-6">

          <div className="mb-2 flex justify-between text-sm">

            <span className="text-slate-400">
              Roadmap Progress
            </span>

            <span className="font-semibold text-cyan-400">
              78%
            </span>

          </div>

          <div className="h-3 rounded-full bg-white/10">

            <div
              className="
                h-full
                w-[78%]
                rounded-full
                bg-gradient-to-r
                from-cyan-500
                to-violet-500
              "
            />

          </div>

        </div>

      </div>

      <div className="mt-8">

        <GradientButton>

          Continue Learning

          <ArrowRight
            size={18}
            className="ml-2"
          />

        </GradientButton>

      </div>

    </motion.div>
  );
}