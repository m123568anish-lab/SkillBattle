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
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border-default)]">
          <Sparkles
            size={40}
            className="text-[var(--accent)]"
          />
        </div>

        <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Your Personalized Roadmap
        </h1>

        <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto">
          {roadmap
            ? `A ${roadmap.duration_weeks}-week preparation journey for ${roadmap.target_company}.`
            : message || "Your preferences are saved. A personalized roadmap can be generated when the AI service is available."}
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
          <Calendar className="mb-3 text-[var(--accent)]" />
          <h3 className="font-semibold text-sm text-[var(--text-muted)]">
            Duration
          </h3>
          <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">
            {roadmap ? `${roadmap.duration_weeks} Weeks` : "Not generated"}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
          <Clock className="mb-3 text-[var(--accent)]" />
          <h3 className="font-semibold text-sm text-[var(--text-muted)]">
            Daily Study
          </h3>
          <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">
            {roadmap ? `${Math.round(roadmap.estimated_hours / Math.max(roadmap.duration_weeks * 5, 1))} Hours` : "Saved preferences"}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
          <Trophy className="mb-3 text-[var(--status-warning)]" />
          <h3 className="font-semibold text-sm text-[var(--text-muted)]">
            XP Rewards
          </h3>
          <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">
            {totalXP} XP
          </p>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        {(roadmap?.weeks ?? []).map((week) => (
          <div
            key={week.id}
            className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Week {week.week_number}
                </h2>
                <p className="mt-1 text-sm font-medium text-[var(--accent)]">
                  {week.title}
                </p>
              </div>

              <span className="self-start sm:self-auto rounded-full bg-[var(--surface-elevated)] border border-[var(--border-default)] px-3.5 py-1 text-xs font-semibold text-[var(--status-warning)]">
                {week.completion}% complete
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {week.tasks.map((task) => (
                <span
                  key={task.id}
                  className="rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
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
          <p className="text-sm text-[var(--text-muted)]">{retryError}</p>
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="mt-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold text-[var(--accent)] hover:border-[var(--accent)] disabled:opacity-50"
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