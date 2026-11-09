"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Bot, ArrowRight, Brain, Terminal } from "lucide-react";
import GradientButton from "@/components/ui/gradient-button";
import { SpotlightCard } from "@/components/ui/spotlight";
import type { AIRecommendation } from "@/types/dashboard";

interface AICoachCardProps {
  recommendation: AIRecommendation;
}

export default function AICoachCard({ recommendation }: AICoachCardProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const handleClick = () => {
    router.push("/career/mentor");
  };

  return (
    <SpotlightCard className="p-6 sm:p-8 rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xl">
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-[var(--surface-elevated)] p-3 border border-[var(--border-subtle)] text-[var(--accent-strong)] shadow-md">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              AI Skill Advisor
            </h2>
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
              Personalized Assessment Analysis
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-2.5 py-0.5 text-xs text-[var(--accent-strong)] font-semibold">
          <Terminal size={12} /> Live Guidance
        </div>
      </div>

      <div className="relative z-10 mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 sm:p-6 transition-colors duration-150 hover:border-[var(--accent)]/30">
        <div className="flex items-center gap-2.5">
          <Brain className="text-[var(--accent-strong)]" size={18} />
          <span className="font-bold text-[var(--text-primary)] text-sm sm:text-base">
            {recommendation.title}
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] font-medium">
          {recommendation.message}
        </p>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-wider">
            <span className="text-[var(--text-muted)]">Skill Alignment</span>
            <span className="text-[var(--accent-strong)] font-mono">{recommendation.progress}%</span>
          </div>

          <div className="h-2 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] overflow-hidden">
            <motion.div
              initial={shouldReduceMotion ? false : { width: 0 }}
              animate={{ width: `${recommendation.progress}%` }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] shadow-[0_0_8px_var(--accent)]"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6">
        <GradientButton onClick={handleClick}>
          <span className="font-bold flex items-center gap-2">
            {recommendation.action}
            <ArrowRight size={16} />
          </span>
        </GradientButton>
      </div>
    </SpotlightCard>
  );
}
