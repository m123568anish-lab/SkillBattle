import Link from "next/link";
import { ArrowRight, Check, Compass, Target, Zap } from "lucide-react";
import type { DashboardCommandCenter } from "@/types/dashboard";

export default function LearningRoadmap({
  commandCenter,
}: {
  commandCenter: DashboardCommandCenter | null | undefined;
}) {
  const roadmap = commandCenter?.roadmap;
  const rawProgress = roadmap?.progress;
  const progress =
    typeof rawProgress === "number" && Number.isFinite(rawProgress)
      ? Math.min(100, Math.max(0, rawProgress))
      : 0;
  const nextAction = commandCenter?.next_best_action;

  return (
    <section
      aria-labelledby="learning-roadmap-title"
      className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-xl transition-all duration-200 hover:border-[var(--accent)]/30 sm:p-7"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent-strong)] shadow-sm">
              <Compass size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                <Zap size={12} className="text-[var(--accent-strong)]" />
                Placement Curriculum
              </p>
              <h2
                id="learning-roadmap-title"
                className="mt-1 truncate text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl"
              >
                {roadmap?.title || "Learning Roadmap"}
              </h2>
            </div>
          </div>

          {roadmap && (
            <span className="shrink-0 rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 py-1 font-mono text-xs font-bold tabular-nums text-[var(--accent-strong)]">
              {progress}% Done
            </span>
          )}
        </div>

        {roadmap ? (
          <>
            {/* Progress Bar */}
            <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-[var(--text-secondary)]">
                  Placement Readiness Milestone
                </span>
                <span className="font-mono text-xs font-bold text-[var(--accent-strong)]">
                  {progress}%
                </span>
              </div>
              <div
                className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)]"
                role="progressbar"
                aria-label="Roadmap progress"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(216,255,62,0.4)] transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Current Phase & Next Target cards */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <Check size={12} aria-hidden="true" className="text-[var(--accent-strong)]" />
                  Current Phase
                </p>
                <p className="mt-2 text-xs font-bold leading-snug text-[var(--text-primary)]">
                  {roadmap.milestone || "Core Algorithms & Data Structures"}
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <Target size={12} aria-hidden="true" className="text-amber-400" />
                  Recommended Next
                </p>
                <p className="mt-2 text-xs font-bold leading-snug text-[var(--text-primary)]">
                  {nextAction?.title || "Advance your problem solving track"}
                </p>
                {nextAction?.why && (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
                    {nextAction.why}
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--surface-elevated)] p-5 text-center">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              No active learning roadmap selected
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Configure your career aspirations and target companies to generate a tailored roadmap.
            </p>
          </div>
        )}
      </div>

      {/* Footer link */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
        {commandCenter?.placement_readiness?.state && (
          <span className="text-xs text-[var(--text-muted)]">
            Readiness:{" "}
            <strong className="font-bold capitalize text-[var(--accent-strong)]">
              {commandCenter.placement_readiness.state.toLowerCase()}
            </strong>
          </span>
        )}
        <Link
          href="/career/roadmap"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3.5 text-xs font-bold text-[var(--text-primary)] transition-all hover:border-[var(--accent)]/50 hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] ml-auto"
        >
          <span>Open Full Roadmap</span>
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
