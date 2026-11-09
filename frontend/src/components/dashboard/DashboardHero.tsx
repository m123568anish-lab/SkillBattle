"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, Shield, Sparkles } from "lucide-react";
import type { UserSummary, DashboardStats, Achievement } from "@/types/dashboard";
import { formatDashboardNumber } from "@/lib/dashboard-data.mjs";
import { useCursorSpotlight } from "@/hooks/use-cursor-spotlight";
import FloatingParticles from "@/components/ui/floating-particles";

interface DashboardHeroProps {
  user: UserSummary;
  stats: DashboardStats;
  achievements?: Achievement[];
}

export default function DashboardHero({ user, stats }: DashboardHeroProps) {
  const { ref, onPointerMove, onPointerLeave } = useCursorSpotlight<HTMLElement>();
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
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="group relative overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 sm:p-7 text-[var(--text-primary)] shadow-2xl transition-[border-color,box-shadow] duration-200 hover:border-[var(--accent)]/30 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)]"
    >
      {/* 1. Cursor Spotlight Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 ease-out motion-reduce:hidden"
        style={{
          opacity: "var(--spotlight-opacity, 0)",
          background:
            "radial-gradient(circle 380px at var(--mouse-x, 50%) var(--mouse-y, 50%), color-mix(in srgb, var(--accent) 9%, transparent), transparent 75%)",
        }}
      />

      {/* 2. Micro Floating Particles in Hero */}
      <FloatingParticles count={6} />

      {/* 3. Subtle Ambient Hero Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl opacity-20"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {avatarUrl && !avatarError ? (
            <Image
              src={avatarUrl}
              alt=""
              width={56}
              height={56}
              unoptimized
              onError={() => setAvatarError(true)}
              className="h-14 w-14 rounded-2xl object-cover ring-2 ring-[var(--accent)]/30 transition-transform duration-200 group-hover:ring-[var(--accent)]/60"
            />
          ) : (
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] text-lg font-black text-[var(--accent-strong)] transition-all duration-200 group-hover:border-[var(--accent)]/40 group-hover:shadow-[0_0_16px_rgba(200,239,114,0.2)]">
              {initials || "QB"}
            </div>
          )}
          <div className="min-w-0">
            <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
              <Sparkles size={12} /> Developer Command Center
            </p>
            <h1 className="truncate text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Welcome back, {name}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span
                className={`flex items-center gap-1 font-semibold ${
                  isStreakMilestone ? "text-amber-400" : "text-[var(--text-muted)]"
                }`}
              >
                <Flame
                  size={14}
                  className={isStreakMilestone ? "text-amber-400 animate-[streak-flame_3s_ease-in-out_infinite]" : "text-[var(--text-muted)]"}
                />
                {stats.streak} day streak
              </span>
              <span className="text-[var(--border-default)]">·</span>
              <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                <Shield size={14} className="text-[var(--accent-secondary)]" />
                Level {level}
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/battle"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-[var(--text-on-accent)] transition-all duration-150 hover:bg-[var(--accent-strong)] hover:shadow-[0_0_20px_rgba(200,239,114,0.35)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)]"
        >
          Enter Battle Arena <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Level XP Progress Bar with Smooth Loading Edge */}
      <div className="relative z-10 mt-6 flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center justify-between gap-3 text-xs sm:w-36 sm:shrink-0">
          <span className="font-semibold text-[var(--text-primary)]">Level {level} progress</span>
          <span className="font-mono text-[var(--accent-strong)]">{progress}%</span>
        </div>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-elevated)] border border-[var(--border-subtle)]"
          role="progressbar"
          aria-label="Progress to next level"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] shadow-[0_0_8px_var(--accent)] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-[var(--text-muted)] font-mono sm:w-36 sm:shrink-0 sm:text-right">
          {formatDashboardNumber(stats.xp_to_next_level)} XP remaining
        </p>
      </div>
    </section>
  );
}
