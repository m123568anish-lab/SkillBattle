"use client";

import GridBackground from "@/components/background/GridBackground";
import { QubiraLogo } from "@/components/brand/QubiraLogo";
import Link from "next/link";
import { Check, Compass, Target, Trophy } from "lucide-react";

interface Props {
  children: React.ReactNode;
  step: number;
}

const setupStages = [
  { label: "Your starting point", detail: "Skills, languages and interests", icon: Compass, start: 0, end: 3 },
  { label: "Learning goals", detail: "A schedule that fits your time", icon: Target, start: 4, end: 4 },
  { label: "Your roadmap", detail: "A focused path to your next step", icon: Trophy, start: 5, end: 6 },
];

export default function OnboardingLayout({ children, step }: Props) {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[var(--surface-canvas)] px-4 py-4 text-[var(--text-primary)] sm:px-6 sm:py-6 lg:px-10">
      <GridBackground />

      <div className="relative z-10 mx-auto w-full max-w-[1440px]">
        <header className="mb-5 flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4 sm:mb-7 sm:pb-5">
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

        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(17rem,0.7fr)_minmax(0,1.3fr)] lg:gap-5 xl:gap-6">
          <aside className="q-panel relative hidden min-h-[38rem] flex-col justify-between overflow-hidden bg-[var(--surface-sidebar)] p-7 lg:flex xl:p-9">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border border-[var(--accent)]/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-[var(--accent)]/[0.06]" />
            <div className="relative">
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.08] text-[var(--accent)]">
                <Compass size={20} aria-hidden="true" />
              </span>
              <p className="q-kicker mt-8">Your Qubira setup</p>
              <h1 className="mt-3 max-w-[12ch] text-3xl font-semibold leading-[1.08] tracking-tight text-[var(--text-primary)] xl:text-[2.6rem]">
                Make your next move count.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                A few thoughtful choices help shape a learning experience around what you know, what you want, and the time you have.
              </p>
            </div>

            <div className="relative">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                The journey
              </p>
              <ol className="space-y-2">
                {setupStages.map(({ label, detail, icon: Icon, start, end }, index) => {
                  const complete = step > end;
                  const current = step >= start && step <= end;
                  return (
                    <li
                      key={label}
                      aria-current={current ? "step" : undefined}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                        current
                          ? "border-[var(--accent)]/30 bg-[var(--accent)]/[0.06]"
                          : "border-[var(--border-subtle)] bg-[var(--surface-elevated)]"
                      }`}
                    >
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${
                        current
                          ? "border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-muted)]"
                      }`}>
                        {complete ? <Check size={15} aria-hidden="true" /> : <Icon size={15} aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[var(--text-primary)]">{label}</span>
                        <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{detail}</span>
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">0{index + 1}</span>
                    </li>
                  );
                })}
              </ol>
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
