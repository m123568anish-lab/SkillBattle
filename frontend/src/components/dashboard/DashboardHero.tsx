"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Swords } from "lucide-react";
import type { UserSummary, DashboardStats, Achievement } from "@/types/dashboard";
import { formatDashboardNumber } from "@/lib/dashboard-data.mjs";

interface DashboardHeroProps {
  user: UserSummary;
  stats: DashboardStats;
  achievements?: Achievement[];
}

export default function DashboardHero({ user, stats }: DashboardHeroProps) {
  const [avatarError, setAvatarError] = useState(false);
  const name = user.full_name?.trim().split(/\s+/)[0] || user.username || "there";
  const level = Math.max(1, stats.level);
  const progress = Math.min(100, Math.max(0, stats.level_progress_percent));
  const initials = (user.full_name || user.username || "QB")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const avatarUrl = user.avatar_url || (user as any).avatar || null;
  const isStreakMilestone = stats.streak >= 3;

  return (
    <section
      data-dashboard-hero
      className="relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 text-[var(--text-primary)] sm:p-6 lg:p-7"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)] lg:items-stretch">
        <div className="flex min-w-0 flex-col justify-between gap-6">
          <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
            {avatarUrl && !avatarError ? (
              <Image
                src={avatarUrl}
                alt=""
                width={60}
                height={60}
                unoptimized
                onError={() => setAvatarError(true)}
                className="h-12 w-12 shrink-0 rounded-xl border border-[var(--border-default)] object-cover sm:h-15 sm:w-15"
              />
            ) : (
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] text-base font-black text-[var(--accent-strong)] sm:h-15 sm:w-15 sm:text-lg">
                {initials || "QB"}
              </div>
            )}
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Your learning space
              </p>
              <h1 className="truncate text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                Welcome back, {name}
              </h1>
              <p className="mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
                Build momentum with one focused session at a time.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${
              isStreakMilestone
                ? "border-amber-400/20 bg-amber-400/[0.07] text-amber-300"
                : "border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
            }`}>
              <Flame size={14} aria-hidden="true" />
              {stats.streak} day streak
            </span>
            <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 text-xs font-semibold text-[var(--text-secondary)]">
              <span className="font-mono text-[var(--accent-strong)]">LVL {level}</span>
              <span aria-hidden="true" className="h-3 w-px bg-[var(--border-default)]" />
              {formatDashboardNumber(stats.xp)} XP
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-5 rounded-xl border border-[var(--border-default)] bg-[#090909] p-4 sm:p-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Level progress</p>
                <p className="mt-1 text-base font-bold text-[var(--text-primary)]">Level {level}</p>
              </div>
              <span className="font-mono text-sm font-bold text-[var(--accent-strong)]">{progress}%</span>
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

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/battle"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-3 text-xs font-bold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              <Swords size={15} aria-hidden="true" /> Arena
            </Link>
            <Link
              href="/practice"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              <BookOpen size={15} aria-hidden="true" /> Learn
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
