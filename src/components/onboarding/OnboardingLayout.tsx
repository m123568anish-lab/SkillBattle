"use client";

import AuroraBackground from "@/components/ui/aurora-background";
import FloatingParticles from "@/components/ui/floating-particles";
import GlassCard from "@/components/ui/glass-card";

interface Props {
  children: React.ReactNode;
}

export default function OnboardingLayout({
  children,
}: Props) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070B14] px-6">

      <AuroraBackground />

      <FloatingParticles />

      <GlassCard className="relative z-10 w-full max-w-3xl p-10">

        {children}

      </GlassCard>

    </main>
  );
}