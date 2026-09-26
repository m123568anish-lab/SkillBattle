"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Trophy,
  Sparkles,
} from "lucide-react";

import GradientButton from "@/components/ui/gradient-button";
import { Roadmap } from "@/services/career.service";
import { OnboardingRoadmapResult } from "@/services/onboarding.service";

interface Props {
  roadmap: Roadmap | null;
  generationStatus: "ready" | "pending";
  message?: string | null;
  onRetry: () => Promise<OnboardingRoadmapResult>;
}

export default function RoadmapPreview({
  roadmap,
  generationStatus,
  message,
  onRetry,
}: Props) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const totalXP = roadmap?.weeks.reduce(
    (sum, week) => sum + week.tasks.reduce((weekXP, task) => weekXP + task.reward_xp, 0),
    0,
  ) ?? 0;

  async function handleRetry() {
    setRetrying(true);
    setRetryError(null);
    try {
      const result = await onRetry();
      if (result.roadmap) router.push("/career/roadmap");
      else setRetryError(result.message || "Roadmap generation is still unavailable.");
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : "Unable to retry roadmap generation.");
    }
    setRetrying(false);
  }

  function handleStart() {
    if (roadmap) {
      router.push("/career/roadmap");
      return;
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
          {roadmap
            ? `A ${roadmap.duration_weeks}-week preparation journey for ${roadmap.target_company}.`
            : message || "Your preferences are saved. A personalized roadmap can be generated when the AI service is available."}
        </p>

      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

          <Calendar className="mb-3 text-cyan-400" />

          <h3 className="font-bold text-white">
            Duration
          </h3>

          <p className="mt-2 text-slate-400">
            {roadmap ? `${roadmap.duration_weeks} Weeks` : "Not generated"}
          </p>

        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

          <Clock className="mb-3 text-cyan-400" />

          <h3 className="font-bold text-white">
            Daily Study
          </h3>

          <p className="mt-2 text-slate-400">
            {roadmap ? `${Math.round(roadmap.estimated_hours / Math.max(roadmap.duration_weeks * 5, 1))} Hours` : "Saved preferences"}
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

        {(roadmap?.weeks ?? []).map((week) => (
          <div
            key={week.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex justify-between">

              <div>

                <h2 className="text-xl font-bold text-white">
                  Week {week.week_number}
                </h2>

                <p className="mt-2 text-cyan-400">
                  {week.title}
                </p>

              </div>

              <span className="rounded-full bg-yellow-500/20 px-4 py-2 text-yellow-300">
                {week.completion}% complete
              </span>

            </div>

            <div className="mt-5 flex flex-wrap gap-3">

              {week.tasks.map((task) => (
                <span
                  key={task.id}
                  className="rounded-full bg-cyan-500/15 px-3 py-2 text-sm text-cyan-300"
                >
                  {task.topic}
                </span>
              ))}

            </div>

          </div>
        ))}

      </div>

      {!roadmap && generationStatus === "pending" && (
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">{retryError}</p>
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="mt-3 rounded-lg border border-cyan-500/30 px-4 py-2 text-sm font-semibold text-cyan-300 disabled:opacity-50"
          >
            {retrying ? "Retrying..." : "Retry roadmap generation"}
          </button>
        </div>
      )}

      <div className="mt-12 flex justify-center">

        <GradientButton
          onClick={handleStart}
        >
          {roadmap ? "View My Roadmap" : "Continue to Dashboard"}
        </GradientButton>

      </div>

    </motion.div>
  );
}