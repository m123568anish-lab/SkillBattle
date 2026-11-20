import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Flame,
  Sparkles,
  Target,
} from "lucide-react";
import type {
  DashboardCommandCenter,
  DailyChallenge as DailyChallengeData,
} from "@/types/dashboard";

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
      className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-xl transition-all duration-200 hover:border-[var(--accent)]/30 sm:p-7"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-sm">
              <Target size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                <Flame size={12} className="text-amber-400" />
                Make Today Count
              </p>
              <h2
                id="daily-focus-title"
                className="mt-1 text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl"
              >
                Today&apos;s Focus & Challenge
              </h2>
            </div>
          </div>

          {isCompleted && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-bold text-emerald-300 shadow-sm">
              <CheckCircle2 size={14} aria-hidden="true" />
              Completed
            </span>
          )}
        </div>

        {isAvailable && challenge ? (
          <>
            <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent-strong)]">
                  <Sparkles size={11} className="text-[var(--accent)]" />
                  Daily Challenge
                </span>
                {challenge.difficulty && (
                  <span className="rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-2 py-0.5 font-mono text-[10px] font-bold capitalize text-[var(--text-secondary)]">
                    {challenge.difficulty}
                  </span>
                )}
                <span className="ml-auto font-mono text-xs font-bold text-[var(--accent-strong)]">
                  +{challenge.xp_reward} XP Bounty
                </span>
              </div>

              <h3 className="mt-3 text-lg font-bold tracking-tight text-[var(--text-primary)]">
                {challenge.title}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                {challenge.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-muted)]">
                <span>
                  XP Reward:{" "}
                  <strong className="font-mono font-bold text-[var(--text-primary)]">
                    {challenge.xp_reward} XP
                  </strong>
                </span>
                {studyTarget?.configured && studyTarget.minutes > 0 && (
                  <span>
                    Daily Goal:{" "}
                    <strong className="font-mono font-bold text-[var(--text-primary)]">
                      {studyTarget.minutes} min
                    </strong>
                  </span>
                )}
              </div>
            </div>

            {firstAction && (
              <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/60 p-3.5">
                <div className="flex items-start gap-3">
                  <BookOpenCheck
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[var(--accent-strong)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Recommended Next Task
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-[var(--text-primary)]">
                      {firstAction.title}
                    </p>
                    {firstAction.description && (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--text-secondary)]">
                        {firstAction.description}
                      </p>
                    )}
                    {firstAction.time && (
                      <p className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-[var(--text-muted)]">
                        <Clock3 size={11} aria-hidden="true" />
                        Est. duration: {firstAction.time}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--surface-elevated)] p-5 text-center">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              All daily challenges completed!
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {firstAction?.title
                ? `Keep your streak going with: ${firstAction.title}`
                : "Explore practice tasks to keep sharpening your technical mastery."}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 pt-3">
        <Link
          href={isAvailable && challenge ? "/practice/tasks" : "/practice"}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-xs font-bold text-[var(--text-on-accent)] shadow-[0_0_16px_rgba(216,255,62,0.2)] transition-all hover:bg-[var(--accent-strong)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] sm:w-auto"
        >
          <span>{isCompleted ? "Review Challenge" : "Start Today's Challenge"}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
