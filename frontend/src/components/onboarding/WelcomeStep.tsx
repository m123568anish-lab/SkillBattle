"use client";

import GradientButton from "@/components/ui/gradient-button";
import QubiraLogo from "@/components/brand/QubiraLogo";
import { Sparkles, Trophy, Cpu, ArrowRight } from "lucide-react";

interface Props {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: Props) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.08]">
          <QubiraLogo variant="icon" size="sm" />
        </div>
        <span className="q-kicker">Your Qubira journey starts here</span>
      </div>

      <div>
        <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-default)] bg-[var(--surface-elevated)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          <Sparkles size={13} className="text-[var(--accent-strong)]" /> Personalized learning
        </div>
        <h1 className="mt-4 max-w-[18ch] text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Prepare with purpose.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
          Tell us what you are learning and where you want to go. We&apos;ll use your preferences to shape your Qubira experience.
        </p>
      </div>

      <div className="grid gap-3 text-left sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--accent-strong)]">
            <Trophy size={18} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Compete</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            Practice solo or test your skills in the arena.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--accent-strong)]">
            <Cpu size={18} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Find your path</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            Set goals and explore your personalized roadmap.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--accent-strong)]">
            <Sparkles size={18} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Track progress</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            Keep your learning activity and achievements together.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--text-muted)]">A few steps to make your workspace yours.</p>
        <GradientButton onClick={onNext} className="min-h-11 min-w-48 rounded-lg group">
          <span className="flex items-center justify-center gap-2">
            Start Setup <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </GradientButton>
      </div>
    </div>
  );
}
