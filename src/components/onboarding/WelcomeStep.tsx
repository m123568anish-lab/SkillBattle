"use client";

import { Sparkles } from "lucide-react";

import GradientButton from "@/components/ui/gradient-button";

interface Props {
  onNext: () => void;
}

export default function WelcomeStep({
  onNext,
}: Props) {
  return (
    <div className="space-y-8 text-center">

      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-cyan-500/20">

        <Sparkles
          size={42}
          className="text-cyan-400"
        />

      </div>

      <h1 className="text-5xl font-black text-white">
        Welcome to SkillBattle
      </h1>

      <p className="mx-auto max-w-xl text-lg text-slate-400">
        Let's personalize your learning
        journey so our AI Coach can
        generate the perfect roadmap for
        you.
      </p>

      <GradientButton
        onClick={onNext}
      >
        Let's Begin
      </GradientButton>

    </div>
  );
}