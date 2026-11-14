"use client";

import GradientButton from "@/components/ui/gradient-button";
import QubiraLogo from "@/components/brand/QubiraLogo";
import { Sparkles, Trophy, Cpu, ArrowRight } from "lucide-react";

interface Props {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: Props) {
  return (
    <div className="space-y-6 sm:space-y-8 text-center">
      <div className="mx-auto flex justify-center">
        <div className="relative">
          <div className="absolute -inset-3 rounded-full bg-[var(--accent)]/10 blur-xl" />
          <div className="relative rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4 shadow-xl">
            <QubiraLogo variant="icon" size="xl" />
          </div>
        </div>
      </div>

      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
          <Sparkles size={13} className="text-[var(--accent)]" /> Competitive Learning Platform
        </div>
        <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)]">
          Accelerate Your Mastery with <span className="text-[var(--accent)]">QUBIRA</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-[var(--text-secondary)]">
          A personalized learning and battle ecosystem calibrated to target software engineering careers at top product organizations.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-3 text-left">
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] mb-3">
            <Trophy size={18} />
          </div>
          <h3 className="text-xs font-bold text-[var(--text-primary)]">Live Arenas</h3>
          <p className="mt-1 text-[11px] text-[var(--text-muted)] leading-relaxed">
            Multiplayer coding battles & MCQ duels with verified rankings.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] mb-3">
            <Cpu size={18} />
          </div>
          <h3 className="text-xs font-bold text-[var(--text-primary)]">AI Roadmap</h3>
          <p className="mt-1 text-[11px] text-[var(--text-muted)] leading-relaxed">
            Personalized study timeline tailored to your dream companies.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] mb-3">
            <Sparkles size={18} />
          </div>
          <h3 className="text-xs font-bold text-[var(--text-primary)]">Skill Calibration</h3>
          <p className="mt-1 text-[11px] text-[var(--text-muted)] leading-relaxed">
            Placement readiness matrix tracked against real benchmarks.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <GradientButton onClick={onNext} className="min-w-48 group">
          <span className="flex items-center justify-center gap-2">
            Start Setup <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </GradientButton>
      </div>
    </div>
  );
}
