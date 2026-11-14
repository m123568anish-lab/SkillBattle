"use client";

import { useEffect, useRef, useState } from "react";
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
  const requestRef = useRef<Promise<OnboardingRoadmapResult> | null>(null);

  useEffect(() => {
    let active = true;

    const resetProgress = () => {
      setLoading(true);
      setError(null);
      setStage(0);
    };

    resetProgress();

    const stageTimer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, messages.length - 1));
    }, 2500);

    const request = requestRef.current ?? (requestRef.current = onGenerate());
    request
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
        <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
          <motion.div
            animate={{
              width: `${progress}%`,
            }}
            transition={{
              duration: 1,
            }}
            className="h-full rounded-full bg-[var(--accent)]"
          />
        </div>

        <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {loading ? `${Math.round(progress)}%` : error ? "Retry available" : "Ready"}
        </p>
      </div>

      <ProgressStage
        stage={stage}
      />

      {error && (
        <div className="mt-8 rounded-xl border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10 p-5 text-center">
          <p className="text-sm text-[var(--text-primary)]">{error}</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                requestRef.current = null;
                setAttempt((value) => value + 1);
              }}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--text-on-accent)] hover:opacity-90"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => onComplete(null)}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Continue without roadmap
            </button>
          </div>
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <h3 className="text-base font-bold text-[var(--accent)]">
          AI Engine
        </h3>

        <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
          We're combining your <strong className="text-[var(--text-primary)]">programming languages</strong>, <strong className="text-[var(--text-primary)]">dream companies</strong>, <strong className="text-[var(--text-primary)]">skill assessment</strong>, and <strong className="text-[var(--text-primary)]">learning goals</strong> to build a personalized preparation roadmap.
        </p>
      </div>

    </motion.div>
  );
}