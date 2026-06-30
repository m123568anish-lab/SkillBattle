"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Flame,
  Target,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import RecommendationCard from "./RecommendationCard";
import { aiCoach } from "@/data/aiCoach";

export default function AICoach() {
  return (
    <section className="relative py-32">

      <div className="mx-auto max-w-7xl px-6">

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="
            overflow-hidden
            rounded-[32px]
            border
            border-white/10
            bg-white/5
            backdrop-blur-2xl
            p-10
          "
        >
          <div className="grid gap-10 lg:grid-cols-2">

            {/* Left */}

            <div>

              <div className="flex items-center gap-4">

                <div className="rounded-2xl bg-cyan-500/20 p-4">
                  <Bot
                    className="text-cyan-400"
                    size={34}
                  />
                </div>

                <div>

                  <p className="text-cyan-300">
                    AI Coach
                  </p>

                  <h2 className="text-4xl font-black text-white">
                    {aiCoach.greeting}
                  </h2>

                </div>

              </div>

              <h3 className="mt-10 text-2xl font-bold text-white">
                {aiCoach.title}
              </h3>

              <div className="mt-6 space-y-4">
                {aiCoach.recommendations.map((item) => (
                  <RecommendationCard
                    key={item}
                    recommendation={item}
                  />
                ))}
              </div>

            </div>

            {/* Right */}

            <div className="space-y-6">

              {/* Weakness */}

              <div className="rounded-2xl bg-white/5 p-6">

                <div className="flex items-center justify-between">

                  <span className="text-slate-400">
                    Weak Topic
                  </span>

                  <Target className="text-red-400" />

                </div>

                <h3 className="mt-3 text-3xl font-bold text-white">
                  {aiCoach.weakness}
                </h3>

              </div>

              {/* Accuracy */}

              <div className="rounded-2xl bg-white/5 p-6">

                <span className="text-slate-400">
                  Accuracy
                </span>

                <div className="mt-4 h-3 rounded-full bg-slate-800">

                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                    style={{
                      width: `${aiCoach.accuracy}%`,
                    }}
                  />

                </div>

                <p className="mt-3 text-xl font-bold text-white">
                  {aiCoach.accuracy}%
                </p>

              </div>

              {/* Bottom */}

              <div className="grid grid-cols-2 gap-5">

                <div className="rounded-2xl bg-white/5 p-5">

                  <Flame className="text-orange-400" />

                  <h3 className="mt-3 text-3xl font-bold text-white">
                    {aiCoach.streak}
                  </h3>

                  <p className="text-slate-400">
                    Day Streak
                  </p>

                </div>

                <div className="rounded-2xl bg-white/5 p-5">

                  <Sparkles className="text-violet-400" />

                  <h3 className="mt-3 text-xl font-bold text-white">
                    {aiCoach.nextGoal}
                  </h3>

                  <p className="text-slate-400">
                    Next Goal
                  </p>

                </div>

              </div>

              <Button
                className="
                  mt-4
                  w-full
                  rounded-xl
                  bg-gradient-to-r
                  from-violet-600
                  to-cyan-500
                  py-6
                  text-lg
                "
              >
                Start AI Session
              </Button>

            </div>

          </div>

        </motion.div>

      </div>

    </section>
  );
}