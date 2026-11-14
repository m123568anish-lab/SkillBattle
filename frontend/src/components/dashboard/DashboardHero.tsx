"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Map } from "lucide-react";
import type { UserSummary, DashboardStats } from "@/types/dashboard";
import { formatDashboardNumber } from "@/lib/dashboard-data.mjs";

interface DashboardHeroProps {
  user: UserSummary;
  stats: DashboardStats;
}

export default function DashboardHero({ user, stats }: DashboardHeroProps) {
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
      className="grid gap-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 sm:gap-6 sm:p-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)] lg:items-stretch"
    >
      <div className="flex min-w-0 flex-col justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              Your learning workspace
            </p>
            <h1 id="dashboard-welcome-title" className="mt-1 truncate text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Welcome back, {name}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Choose a focused next step and keep your progress moving.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/practice"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-3 text-sm font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] sm:px-4"
          >
            <BookOpen size={16} aria-hidden="true" />
            Continue learning
          </Link>
          <Link
            href="/career/roadmap"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] sm:px-4"
          >
            <Map size={16} aria-hidden="true" />
            <span className="sm:hidden">Roadmap</span>
            <span className="hidden sm:inline">View roadmap</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-col justify-center rounded-xl border border-[var(--border-default)] bg-[#090909] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Current level
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Level {level}</p>
          </div>
          <span className="rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-[var(--accent-strong)]">
            {progress}%
          </span>
        </div>

        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-elevated)]"
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
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          {formatDashboardNumber(stats.xp_to_next_level)} XP to your next level
        </p>
      </div>
    </section>
  );
}
