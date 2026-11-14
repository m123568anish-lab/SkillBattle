"use client";

import GridBackground from "@/components/background/GridBackground";
import { QubiraLogo } from "@/components/brand/QubiraLogo";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: Props) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-[var(--surface-canvas)] px-4 py-12 text-[var(--text-primary)] sm:px-6">
      <GridBackground />

      <div className="relative z-10 mb-6">
        <Link href="/" className="inline-block transition-opacity hover:opacity-85">
          <QubiraLogo variant="full" size="sm" />
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-2xl backdrop-blur-sm sm:p-10">
        {children}
      </div>
    </main>
  );
}
