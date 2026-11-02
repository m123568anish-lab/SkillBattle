"use client";

import { Sparkles } from "lucide-react";
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

      <h1 className="text-4xl sm:text-5xl font-black text-white">
        Welcome to <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">QUBIRA</span>
      </h1>

      <p className="mx-auto max-w-xl text-lg text-slate-300">
        Let&apos;s personalize your learning journey so Qubira Mentor can generate the perfect technical roadmap for you.
      </p>

      <GradientButton onClick={onNext}>
        Let&apos;s Begin
      </GradientButton>
    </div>
  );
}
