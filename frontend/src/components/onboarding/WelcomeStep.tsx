"use client";

import GradientButton from "@/components/ui/gradient-button";
import QubiraLogo from "@/components/brand/QubiraLogo";

interface Props {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: Props) {
  return (
    <div className="space-y-8 text-center">
      <div className="mx-auto flex justify-center">
        <QubiraLogo variant="icon" size="xl" />
      </div>

      <div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
          Adaptive Skill Architecture
        </span>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)]">
          Welcome to <span className="text-[var(--accent)]">QUBIRA</span>
        </h1>
      </div>

      <p className="mx-auto max-w-xl text-base sm:text-lg leading-relaxed text-[var(--text-secondary)]">
        Personalize your technical profile so Qubira can calibrate your skill benchmarks, practice challenges, and AI learning roadmap.
      </p>

      <div className="pt-2">
        <GradientButton onClick={onNext} className="min-w-44">
          Let&apos;s Begin
        </GradientButton>
      </div>
    </div>
  );
}
