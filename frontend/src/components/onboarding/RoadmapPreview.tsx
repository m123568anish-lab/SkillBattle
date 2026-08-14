"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Trophy,
  Sparkles,
} from "lucide-react";

import GradientButton from "@/components/ui/gradient-button";
import { roadmap } from "@/data/roadmap";

interface Props {
  onContinue?: () => Promise<void> | void;
}

export default function RoadmapPreview({
  onContinue,
}: Props) {
  const router = useRouter();

  const totalXP = roadmap.reduce(
    (sum, item) => sum + item.xp,
    0
  );

  async function handleStart() {
    if (onContinue) {
      await onContinue();
    }

    router.push("/dashboard");
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      className="mx-auto max-w-6xl"
    >
      <div className="text-center">

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-cyan-500/10">

          <Sparkles
            size={48}
            className="text-cyan-400"
          />

        </div>

        <h1 className="mt-6 text-5xl font-black text-white">
          Your Personalized Roadmap
        </h1>

        <p className="mt-4 text-slate-400">
          AI has created an 8-week preparation
          journey just for you.
        </p>

      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

          <Calendar className="mb-3 text-cyan-400" />

          <h3 className="font-bold text-white">
            Duration
          </h3>

          <p className="mt-2 text-slate-400">
            8 Weeks
          </p>

        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

          <Clock className="mb-3 text-cyan-400" />

          <h3 className="font-bold text-white">
            Daily Study
          </h3>

          <p className="mt-2 text-slate-400">
            2 Hours
          </p>

        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

          <Trophy className="mb-3 text-yellow-400" />

          <h3 className="font-bold text-white">
            XP Rewards
          </h3>

          <p className="mt-2 text-slate-400">
            {totalXP} XP
          </p>

        </div>

      </div>

      <div className="mt-12 space-y-5">

        {roadmap.map((week) => (
          <div
            key={week.week}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex justify-between">

              <div>

                <h2 className="text-xl font-bold text-white">
                  Week {week.week}
                </h2>

                <p className="mt-2 text-cyan-400">
                  {week.title}
                </p>

              </div>

              <span className="rounded-full bg-yellow-500/20 px-4 py-2 text-yellow-300">
                +{week.xp} XP
              </span>

            </div>

            <div className="mt-5 flex flex-wrap gap-3">

              {week.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-cyan-500/15 px-3 py-2 text-sm text-cyan-300"
                >
                  {topic}
                </span>
              ))}

            </div>

          </div>
        ))}

      </div>

      <div className="mt-12 flex justify-center">

        <GradientButton
          onClick={handleStart}
        >
          🚀 Start My Journey
        </GradientButton>

      </div>

    </motion.div>
  );
}