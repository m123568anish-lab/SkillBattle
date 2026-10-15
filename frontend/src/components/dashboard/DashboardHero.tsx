"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Flame, Zap, ArrowRight, Swords, Sparkles, Trophy, Shield } from "lucide-react";
import type { UserSummary, DashboardStats, Achievement } from "@/types/dashboard";
import { useRouter } from "next/navigation";

interface DashboardHeroProps {
  user: UserSummary;
  stats: DashboardStats;
  achievements?: Achievement[];
}

export default function DashboardHero({ user, stats, achievements = [] }: DashboardHeroProps) {
  const router = useRouter();
  const level = stats.level;
  const nextLevelXP = Math.max(2500, (level + 1) * 2500);
  const xpPercentage = Math.min(100, Math.round((stats.xp / nextLevelXP) * 100));
  const xpRemaining = Math.max(0, nextLevelXP - stats.xp);

  const initials = (user.full_name || user.username || "SkillBattle Player")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "SB";

  const verifiedAchievementsCount = achievements.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6 sm:p-8 shadow-2xl shadow-black/60"
    >
      {/* Restrained Ambient Accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-500/5 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: User Identity & Badges */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative flex-shrink-0">
            <div className="relative rounded-2xl border border-white/10 bg-[#060913] p-1 shadow-xl">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.full_name || "User avatar"}
                  width={88}
                  height={88}
                  unoptimized
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="h-20 w-20 sm:h-22 sm:w-22 rounded-xl object-cover"
                />
              ) : (
                <div
                  aria-label={user.full_name || "User"}
                  className="grid h-20 w-20 sm:h-22 sm:w-22 place-items-center rounded-xl bg-slate-800/80 text-2xl font-black text-cyan-200"
                >
                  {initials}
                </div>
              )}
            </div>
            <span className="absolute -bottom-2 -right-1.5 flex h-7 items-center justify-center rounded-lg bg-cyan-500 px-2 text-[11px] font-black uppercase tracking-wider text-slate-950 shadow-md">
              LVL {level}
            </span>
          </div>

          <div className="text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                {user.full_name || user.username || "SkillBattle Player"}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                <Shield size={12} className="text-cyan-400" />
                Ranked
              </span>
            </div>

            <p className="text-sm font-medium text-slate-400">
              @{user.username || "player"} · <span className="text-slate-500">{user.email}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <div className="flex items-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-300">
                <Flame size={13} className="text-orange-400" />
                <span>{stats.streak} Day Streak</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-bold text-violet-300">
                <Zap size={13} className="text-violet-400" />
                <span>{stats.xp.toLocaleString()} Total XP</span>
              </div>
              {verifiedAchievementsCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-xs font-bold text-yellow-300">
                  <Trophy size={13} className="text-yellow-400" />
                  <span>{verifiedAchievementsCount} Unlocked</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: XP Progress & Prominent Next Action CTA */}
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-4 lg:w-96 flex-shrink-0">
          {/* XP Progress Bar */}
          <div className="flex-1 rounded-2xl border border-white/[0.06] bg-[#060913]/60 p-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-cyan-400" />
                Level {level + 1} Target
              </span>
              <span className="text-cyan-300 font-mono">{xpPercentage}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>{stats.xp.toLocaleString()} XP</span>
              <span className="text-slate-400">{xpRemaining.toLocaleString()} XP to level up</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col gap-2 justify-center sm:w-44 flex-shrink-0">
            <button
              onClick={() => router.push("/battle")}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:shadow-cyan-500/35 hover:brightness-110 active:scale-[0.98]"
            >
              <Swords size={16} className="text-slate-950" />
              <span>Enter Arena</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => router.push("/leaderboard")}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white transition"
            >
              <Trophy size={12} className="text-yellow-400" />
              <span>View Leaderboard</span>
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}