"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import type { DailyChallenge as DailyChallengeType } from "@/types/dashboard";

export default function DailyChallenge({ challenge }: { challenge: DailyChallengeType }) {
  const router = useRouter();
  const isAvailable = challenge.id !== "0";
  const isCompleted = isAvailable && Boolean(challenge.is_completed);

  return (
    <section
      aria-labelledby="daily-challenge-title"
      className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--accent-strong)]">
            <Target size={19} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Today’s focus
            </p>
            <h2 id="daily-challenge-title" className="mt-0.5 text-base font-semibold text-[var(--text-primary)]">
              Daily challenge
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

      {isAvailable ? (
        <>
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{challenge.title}</h3>
              {challenge.difficulty && (
                <span className="rounded-md border border-[var(--border-default)] bg-[var(--surface-elevated)] px-2 py-1 text-[10px] font-medium capitalize text-[var(--text-secondary)]">
                  {challenge.difficulty}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{challenge.description}</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
            <p className="text-xs text-[var(--text-muted)]">
              Reward: <span className="font-semibold tabular-nums text-[var(--text-secondary)]">{challenge.xp_reward} XP</span>
            </p>
            <button
              type="button"
              onClick={() => router.push("/practice/tasks")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              {isCompleted ? "Review challenge" : "Start challenge"}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-[var(--border-default)] p-4">
          <p className="text-sm font-medium text-[var(--text-primary)]">No challenge is available right now.</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            You can keep building your skills with the practice catalog.
          </p>
          <button
            type="button"
            onClick={() => router.push("/practice")}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          >
            Browse practice <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
