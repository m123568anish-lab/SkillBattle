"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Swords } from "lucide-react";
import type { UserSummary, DashboardStats } from "@/types/dashboard";
import { formatDashboardNumber } from "@/lib/dashboard-data.mjs";

interface DashboardHeroProps {
  user: UserSummary;
  stats: DashboardStats;
  learningGoal?: string;
  nextAction?: string;
}

export default function DashboardHero({ user, stats, learningGoal, nextAction }: DashboardHeroProps) {
  const name = user.full_name?.trim().split(/\s+/)[0] || user.username || "there";
  const level = Math.max(1, Number.isFinite(stats.level) ? stats.level : 1);
  const progress = Number.isFinite(stats.level_progress_percent)
    ? Math.min(100, Math.max(0, stats.level_progress_percent))
    : 0;
  const initials = (user.full_name || user.username || "QB")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const avatarUrl = user.avatar_url || user.avatar || null;

  return (
    <section
      data-dashboard-hero
      aria-labelledby="dashboard-welcome-title"
      className="q-panel relative grid gap-5 overflow-hidden p-5 sm:gap-7 sm:p-7 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] xl:items-stretch"
    >
      <div className="flex min-w-0 flex-col justify-between gap-7">
        <div>
          <p className="q-kicker">Your learning workspace</p>
          <h1 id="dashboard-welcome-title" className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Welcome back, {name}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Build your skills. Win your battles. Get placement ready.
          </p>
        </div>

        <div className="flex min-w-0 items-center gap-3 border-t border-[var(--border-subtle)] pt-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={56}
              height={56}
              unoptimized
              className="h-12 w-12 shrink-0 rounded-xl border border-[var(--border-default)] object-cover sm:h-14 sm:w-14"
            />
          ) : (
            <div
              aria-hidden="true"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] text-base font-bold text-[var(--accent-strong)] sm:h-14 sm:w-14"
            >
              {initials || "QB"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {learningGoal ? "Current learning goal" : "Learning roadmap"}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
              {learningGoal || "Set up a roadmap to personalize your next steps"}
            </p>
            {nextAction && (
              <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                Next up: {nextAction}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/practice"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          >
            <BookOpen size={16} aria-hidden="true" />
            Continue learning <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link
            href="/battle"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          >
            <Swords size={16} aria-hidden="true" />
            Enter Battle Arena
          </Link>
        </div>
      </div>

      <div className="flex min-w-0 flex-col justify-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Level progress
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Level {level}</p>
          </div>
          <span className="rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-[var(--accent-strong)]">
            {progress}%
          </span>
        </div>

        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-hover)]"
          role="progressbar"
          aria-label="Progress to next level"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
          <span>{formatDashboardNumber(stats.xp_to_next_level)} XP to next level</span>
          <span className="font-mono tabular-nums">{formatDashboardNumber(stats.xp)} total XP</span>
        </p>
      </div>
    </section>
  );
}
