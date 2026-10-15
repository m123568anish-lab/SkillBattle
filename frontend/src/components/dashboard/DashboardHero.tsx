"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, Shield, Sparkles } from "lucide-react";
import type { UserSummary, DashboardStats, Achievement } from "@/types/dashboard";

interface DashboardHeroProps {
  user: UserSummary;
  stats: DashboardStats;
  achievements?: Achievement[];
}

export default function DashboardHero({ user, stats }: DashboardHeroProps) {
  const name = user.full_name?.trim().split(/\s+/)[0] || user.username || "there";
  const level = Math.max(1, stats.level);
  const nextLevelXP = Math.max(2500, (level + 1) * 2500);
  const progress = Math.min(100, Math.round((stats.xp / nextLevelXP) * 100));
  const initials = (user.full_name || user.username || "SB")
    .split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#101a2c] via-[#0a0f1d] to-[#0a0f1d] p-5 sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan-500/[0.08] blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {user.avatar_url ? (
            <Image src={user.avatar_url} alt="" width={56} height={56} unoptimized className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10" />
          ) : (
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-lg font-bold text-cyan-200">{initials || "SB"}</div>
          )}
          <div className="min-w-0">
            <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300"><Sparkles size={12} /> Learning dashboard</p>
            <h1 className="truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">Welcome back, {name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400"><Flame size={14} className="text-orange-300" />{stats.streak} day streak <span className="mx-1 text-slate-600">·</span><Shield size={14} className="text-violet-300" />Level {level}</p>
          </div>
        </div>
        <Link href="/battle" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">
          Start a battle <ArrowRight size={16} />
        </Link>
      </div>
      <div className="relative mt-6 flex flex-col gap-2 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center justify-between gap-3 text-xs sm:w-36 sm:shrink-0">
          <span className="font-semibold text-white">Level {level} progress</span><span className="text-slate-400">{progress}%</span>
        </div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-label="Progress to next level" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-slate-500 sm:w-36 sm:shrink-0 sm:text-right">{stats.xp.toLocaleString()} XP earned</p>
      </div>
    </section>
  );
}
