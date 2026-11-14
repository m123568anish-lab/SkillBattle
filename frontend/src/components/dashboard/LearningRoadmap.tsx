import Link from "next/link";
import { ArrowRight, Check, Compass, Target } from "lucide-react";
import type { DashboardCommandCenter } from "@/types/dashboard";

export default function LearningRoadmap({
  commandCenter,
}: {
  commandCenter: DashboardCommandCenter | null | undefined;
}) {
  const roadmap = commandCenter?.roadmap;
  const rawProgress = roadmap?.progress;
  const progress = typeof rawProgress === "number" && Number.isFinite(rawProgress)
    ? Math.min(100, Math.max(0, rawProgress))
    : 0;
  const nextAction = commandCenter?.next_best_action;

  return (
    <section
      aria-labelledby="learning-roadmap-title"
      className="q-panel min-w-0 p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--accent-strong)]">
            <Compass size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="q-kicker">Your learning journey</p>
            <h2 id="learning-roadmap-title" className="mt-1 truncate text-lg font-semibold text-[var(--text-primary)]">
              {roadmap?.title || "Learning roadmap"}
            </h2>
          </div>
        </div>
        {roadmap && (
          <span className="shrink-0 rounded-md border border-[var(--border-default)] bg-[var(--surface-elevated)] px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-[var(--text-primary)]">
            {progress}%
          </span>
        )}
      </div>

      {roadmap ? (
        <>
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-[var(--text-secondary)]">Overall progress</span>
              <span className="text-[var(--text-muted)]">Placement readiness</span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-hover)]"
              role="progressbar"
              aria-label="Roadmap progress"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                <Check size={13} aria-hidden="true" className="text-[var(--accent-strong)]" />
                Current phase
              </p>
              <p className="mt-2 text-sm font-semibold leading-snug text-[var(--text-primary)]">
                {roadmap.milestone || "Your current learning phase"}
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                <Target size={13} aria-hidden="true" className="text-[var(--accent-strong)]" />
                Recommended next
              </p>
              <p className="mt-2 text-sm font-semibold leading-snug text-[var(--text-primary)]">
                {nextAction?.title || "Continue your current roadmap"}
              </p>
              {nextAction?.why && (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
                  {nextAction.why}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
            {commandCenter?.placement_readiness?.state && (
              <span className="text-xs text-[var(--text-muted)]">
                Readiness: <strong className="font-semibold capitalize text-[var(--text-secondary)]">
                  {commandCenter.placement_readiness.state.toLowerCase()}
                </strong>
              </span>
            )}
            <Link
              href="/career/roadmap"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              Open roadmap <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--surface-elevated)] p-4 sm:p-5">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Your roadmap is ready to begin</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
            Set a learning goal to get a personalized path and recommended next steps.
          </p>
          <Link
            href="/career/roadmap"
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          >
            Set up roadmap <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
