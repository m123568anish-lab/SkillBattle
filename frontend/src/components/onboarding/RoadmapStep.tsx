"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AxiosError } from "axios";

import AIThinking from "./AIThinking";
import TypingText from "./TypingText";
import ProgressStage from "./ProgressStage";
import { OnboardingRoadmapResult } from "@/services/onboarding.service";

interface Props {
  onGenerate: () => Promise<OnboardingRoadmapResult>;
  onComplete: (result: OnboardingRoadmapResult | null) => void;
}

const messages = [
  "Analyzing your profile...",
  "Matching dream companies...",
  "Creating your AI roadmap...",
  "Finalizing your learning journey...",
];

export default function RoadmapStep({
  onGenerate,
  onComplete,
}: Props) {
  const [stage, setStage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setStage(0);
    const stageTimer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, messages.length - 1));
    }, 2500);

    onGenerate()
      .then((result) => {
        if (active) onComplete(result);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        const responseError = reason as AxiosError<{ detail?: string; message?: string }>;
        setError(
          responseError.response?.data?.detail ||
          responseError.response?.data?.message ||
          (reason instanceof Error ? reason.message : "Unable to save your preferences."),
        );
        setLoading(false);
      });

    return () => {
      active = false;
      window.clearInterval(stageTimer);
    };
  }, [attempt, onComplete, onGenerate]);

  const progress = loading ? ((stage + 1) / messages.length) * 100 : 100;

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      className="mx-auto max-w-3xl"
    >
      <AIThinking />

      <div className="mt-10">
        <TypingText
          text={error ? "Your preferences are saved separately from roadmap generation." : messages[stage]}
        />
      </div>

      {/* Progress Bar */}

      <div className="mt-10">

        <div className="h-3 overflow-hidden rounded-full bg-white/10">

          <motion.div
            animate={{
              width: `${progress}%`,
            }}
            transition={{
              duration: 1,
            }}
            className="
              h-full
              rounded-full
              bg-gradient-to-r
              from-cyan-500
              via-sky-500
              to-violet-500
            "
          />

        </div>

        <p className="mt-3 text-center text-slate-400">

          {loading ? `${Math.round(progress)}%` : error ? "Retry available" : "Ready"}

        </p>

      </div>

      <ProgressStage
        stage={stage}
      />

      {error && (
        <div className="mt-8 rounded-xl border border-rose-500/20 bg-rose-500/10 p-5 text-center">
          <p className="text-sm text-rose-200">{error}</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => onComplete(null)}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200"
            >
              Continue without roadmap
            </button>
          </div>
        </div>
      )}

      <div className="mt-12 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-6">

        <h3 className="text-lg font-bold text-cyan-300">

          AI Engine

        </h3>

        <p className="mt-3 text-slate-300 leading-7">

          We're combining your

          <strong> programming languages</strong>,

          <strong> dream companies</strong>,

          <strong> skill assessment</strong>

          and

          <strong> learning goals</strong>

          to build a personalized preparation roadmap.

        </p>

      </div>

    </motion.div>
  );
}