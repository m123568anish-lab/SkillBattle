"use client";

import GridBackground from "@/components/background/GridBackground";
import { QubiraLogo } from "@/components/brand/QubiraLogo";
import Link from "next/link";
import { Compass, Target, Trophy } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

const setupHighlights = [
  { label: "Languages & companies", icon: Compass },
  { label: "Skills & goals", icon: Target },
  { label: "Personal roadmap", icon: Trophy },
];

export default function OnboardingLayout({ children }: Props) {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[var(--surface-canvas)] px-4 py-5 text-[var(--text-primary)] sm:px-6 sm:py-7 lg:px-10">
      <GridBackground />

      <div className="relative z-10 mx-auto w-full max-w-[1440px]">
        <header className="mb-6 flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4 sm:mb-8 sm:pb-5">
          <Link
            href="/"
            aria-label="Qubira home"
            className="inline-flex rounded-lg transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          >
            <QubiraLogo variant="full" size="sm" />
          </Link>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Student setup
            </p>
            <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
              Build a plan around your goals
            </p>
          </div>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(15rem,0.68fr)_minmax(0,1.32fr)] lg:gap-6">
          <aside className="q-panel relative hidden min-h-[34rem] flex-col justify-between overflow-hidden p-7 lg:flex xl:p-9">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border border-[var(--accent)]/10" />
            <div className="relative">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.08] text-[var(--accent-strong)]">
                <Compass size={20} aria-hidden="true" />
              </span>
              <p className="q-kicker mt-7">A focused next step</p>
              <h1 className="mt-3 max-w-[12ch] text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] xl:text-4xl">
                Turn your ambition into a learning plan.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
                Share what you know and what you want to achieve. Qubira uses your preferences to shape a roadmap that fits your preparation.
              </p>
            </div>

            <div className="relative">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Your setup
              </p>
              <ul className="space-y-2">
                {setupHighlights.map(({ label, icon: Icon }) => (
                  <li key={label} className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3">
                    <span className="grid h-8 w-8 place-items-center rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)]">
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="q-panel min-w-0 p-5 sm:p-7 lg:p-8 xl:p-10">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
