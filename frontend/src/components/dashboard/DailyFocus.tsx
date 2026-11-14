import Link from "next/link";
import { ArrowRight, BookOpenCheck, CheckCircle2, Clock3, Flame, Target } from "lucide-react";
import type { DashboardCommandCenter, DailyChallenge as DailyChallengeData } from "@/types/dashboard";

export default function DailyFocus({
  challenge,
  commandCenter,
}: {
  challenge: DailyChallengeData | null | undefined;
  commandCenter: DashboardCommandCenter | null | undefined;
}) {
  const isAvailable = Boolean(challenge?.id && challenge.id !== "0");
  const isCompleted = isAvailable && Boolean(challenge?.is_completed);
  const firstAction = commandCenter?.daily_actions?.[0];
  const studyTarget = commandCenter?.study_hours;

  return (
    <section
      aria-labelledby="daily-focus-title"
      className="q-panel relative min-w-0 overflow-hidden p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/[0.08] text-[var(--accent-strong)]">
            <Target size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="q-kicker">Make today count</p>
            <h2 id="daily-focus-title" className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              Today&apos;s focus
            </h2>
          </div>
        </div>
        {isCompleted && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/[0.08] px-2 py-1 text-[10px] font-semibold text-emerald-300">
            <CheckCircle2 size={13} aria-hidden="true" />
            Completed
          </span>
        )}
      </div>

      {isAvailable && challenge ? (
        <>
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                <Flame size={13} aria-hidden="true" className="text-[var(--accent-strong)]" />
                Daily challenge
              </span>
              {challenge.difficulty && (
                <span className="rounded-md border border-[var(--border-default)] bg-[var(--surface-elevated)] px-2 py-0.5 text-[10px] font-medium capitalize text-[var(--text-secondary)]">
                  {challenge.difficulty}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              {challenge.title}
            </h3>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              {challenge.description}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--border-subtle)] pt-4 text-xs text-[var(--text-muted)]">
            <span>Reward <strong className="font-semibold tabular-nums text-[var(--text-primary)]">{challenge.xp_reward} XP</strong></span>
            {studyTarget?.configured && studyTarget.minutes > 0 && (
              <span>Daily target <strong className="font-semibold text-[var(--text-primary)]">{studyTarget.minutes} min</strong></span>
            )}
          </div>

          {firstAction && (
            <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3.5">
              <div className="flex items-start gap-3">
                <BookOpenCheck size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--accent-strong)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Recommended task
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{firstAction.title}</p>
                  {firstAction.description && (
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{firstAction.description}</p>
                  )}
                  {firstAction.time && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-muted)]">
                      <Clock3 size={12} aria-hidden="true" />
                      Estimated duration: {firstAction.time}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Link
            href="/practice/tasks"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] sm:w-auto"
          >
            {isCompleted ? "Review challenge" : "Start challenge"}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--surface-elevated)] p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">No daily challenge is available right now.</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
            {firstAction?.title
              ? `Keep your momentum with ${firstAction.title}.`
              : "Choose a practice task to keep building your skills."}
          </p>
          {firstAction?.time && <p className="mt-2 text-xs text-[var(--text-muted)]">Estimated time: {firstAction.time}</p>}
          <Link
            href="/practice"
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          >
            Browse practice <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
