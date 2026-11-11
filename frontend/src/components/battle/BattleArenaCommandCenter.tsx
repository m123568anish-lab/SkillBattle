"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Code2,
  Flame,
  Gauge,
  ShieldCheck,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { BattleHistoryItem } from "@/services/battle.service";

type Skill = {
  skill: string;
  score: number;
  attempts: number;
  verified?: boolean;
  sources?: string[];
};

type UserProfileStats = {
  rating: number | null;
  total_xp: number | null;
  level: number | null;
  battles_count: number | null;
  xp_to_next_level: number | null;
  level_progress_percent: number | null;
  win_rate?: number;
};

export default function BattleArenaCommandCenter({
  skillList,
  averageSkill,
  weakSkills,
  loading,
  profileLoadFailed,
  historyLoadFailed,
  userStats,
  history,
  onRetry,
}: {
  skillList: Skill[];
  averageSkill: number;
  weakSkills: Skill[];
  loading: boolean;
  profileLoadFailed: boolean;
  historyLoadFailed: boolean;
  userStats: UserProfileStats;
  history: BattleHistoryItem[];
  onRetry: () => void;
}) {
  const router = useRouter();

  // Rating Tier Calculation
  const getRatingTier = (rating: number) => {
    if (rating >= 1800) return { label: "Grandmaster", color: "text-[#F5F5F5] border-[#D8FF3E]/40 bg-[#D8FF3E]/10" };
    if (rating >= 1500) return { label: "Master", color: "text-[#F5F5F5] border-[#D8FF3E]/30 bg-[#D8FF3E]/10" };
    if (rating >= 1300) return { label: "Diamond", color: "text-[#D8FF3E] border-[#D8FF3E]/30 bg-[#D8FF3E]/10" };
    if (rating >= 1100) return { label: "Platinum", color: "text-[#E4E4E7] border-[#252525] bg-[#101010]" };
    return { label: "Competitor", color: "text-[#A1A1AA] border-[#252525] bg-[#101010]" };
  };

  const ratingTier = userStats.rating === null
    ? { label: profileLoadFailed ? "Unavailable" : "No data", color: "text-slate-300 border-slate-700 bg-slate-800/50" }
    : getRatingTier(userStats.rating);
  const levelProgressPercent = Math.min(100, Math.max(0, userStats.level_progress_percent ?? 0));

  return (
    <div className="space-y-6 pb-12 text-white sm:space-y-8">
      {/* ── 1. Hero Section ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] border border-[#D8FF3E]/25 bg-[#050505] p-5 shadow-[0_16px_48px_rgba(216,255,62,0.08)] sm:rounded-[32px] sm:p-7 md:p-9"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(216,255,62,0.10),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(216,255,62,0.06),_transparent_25%)]" />
        <div className="relative z-10 flex flex-col gap-6 sm:gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D8FF3E]/35 bg-[#D8FF3E]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#EAFCCB] sm:px-3.5 sm:text-xs sm:tracking-[0.25em]">
              <Swords size={13} className="text-[#D8FF3E]" />
              Battle Arena Command Center
            </div>

            <h1 className="max-w-[14ch] text-[2rem] font-black leading-[1.05] tracking-[-0.045em] text-white sm:max-w-none sm:text-4xl md:text-5xl lg:text-6xl">
              Competitive programming for <span className="text-[#D8FF3E]">serious learners</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#A1A1AA] sm:mt-4 sm:text-base md:text-lg">
              Practice with server-backed questions, create coding battles, and keep your placement and performance data in a single competitive workflow.
            </p>
          </div>

          {/* Primary Quick Launch CTAs */}
          <div className="grid gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
            <button
              type="button"
              onClick={() => router.push("/battle/solo?mode=mcq")}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#D8FF3E]/40 bg-[#D8FF3E] px-4 py-3 text-sm font-bold text-[#101010] transition-colors hover:bg-[#EAFCCB] active:translate-y-0 sm:w-auto sm:gap-2.5 sm:rounded-2xl sm:px-6 sm:py-3.5 sm:shadow-[0_10px_30px_rgba(216,255,62,0.18)]"
            >
              <BookOpen size={16} />
              Start MCQ Practice
            </button>

            <button
              type="button"
              onClick={() => router.push("/battle/solo?mode=coding")}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#D8FF3E]/30 bg-[#101010] px-4 py-3 text-sm font-bold text-[#F5F5F5] transition hover:border-[#D8FF3E]/60 hover:bg-[#151515] active:translate-y-0 sm:w-auto sm:gap-2.5 sm:rounded-2xl sm:px-6 sm:py-3.5"
            >
              <Code2 size={16} className="text-[#D8FF3E]" />
              Start Coding Battle
            </button>

            <button
              type="button"
              onClick={() => router.push("/battle/lobby")}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#252525] bg-[#101010] px-4 py-3 text-sm font-bold text-[#E4E4E7] transition hover:border-[#D8FF3E]/40 hover:text-[#F5F5F5] sm:w-auto sm:rounded-2xl sm:px-5 sm:py-3.5"
            >
              <Users size={16} className="text-[#D8FF3E]" />
              1v1 Matchmaking
            </button>
          </div>
        </div>
      </motion.section>

      {/* ── Navigation Strip (No QuestMap) ── */}
      <nav aria-label="Battle Arena sections" className="-mx-4 flex touch-pan-x gap-2 overflow-x-auto border-b border-[#252525] px-4 pb-3 text-sm scrollbar-none sm:mx-0 sm:px-0">
        {[
          { label: "MCQ Practice", href: "/battle/solo?mode=mcq", icon: BookOpen },
          { label: "Coding Battle", href: "/battle/solo?mode=coding", icon: Code2 },
          { label: "Multiplayer Queue", href: "/battle/lobby", icon: Users },
          { label: "Tournaments", href: "/tournament", icon: Trophy },
          { label: "Placement Prep", href: "/battle/placement-prep", icon: ShieldCheck },
          { label: "Battle History", href: "/analytics", icon: TrendingUp },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#252525] bg-[#0B0B0B] px-4 py-2 text-xs font-semibold text-[#A1A1AA] transition hover:border-[#D8FF3E]/40 hover:bg-[#101010] hover:text-[#F5F5F5]"
            >
              <Icon size={14} className="text-[#D8FF3E]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── 2. Competitive Profile Metrics ── */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="min-w-0 rounded-2xl border border-[#252525] bg-[#101010] p-3.5 sm:rounded-[24px] sm:p-5"
        >
          <div className="flex min-h-10 flex-wrap items-start justify-between gap-2 sm:items-center">
            <span className="text-[9px] font-semibold uppercase leading-relaxed tracking-[0.1em] text-[#A1A1AA] sm:text-xs sm:tracking-[0.2em]">Competitive Rating</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ratingTier.color}`}>
              {ratingTier.label}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="break-all text-2xl font-black text-white sm:text-3xl">{userStats.rating ?? (profileLoadFailed ? "Unavailable" : "—")}</span>
            <span className="text-[10px] text-slate-400 sm:text-xs">Elo points</span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-400 sm:text-xs">Current account rating</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="min-w-0 rounded-2xl border border-[#252525] bg-[#101010] p-3.5 sm:rounded-[24px] sm:p-5"
        >
          <div className="flex min-h-10 flex-wrap items-start justify-between gap-2 sm:items-center">
            <span className="text-[9px] font-semibold uppercase leading-relaxed tracking-[0.1em] text-[#A1A1AA] sm:text-xs sm:tracking-[0.2em]">Verified XP & Level</span>
            <span className="rounded-full border border-[#D8FF3E]/40 bg-[#D8FF3E]/10 px-2 py-0.5 text-[9px] font-bold text-[#D8FF3E] sm:px-2.5 sm:text-[10px]">
              Level {userStats.level ?? (profileLoadFailed ? "Unavailable" : "—")}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="break-all text-2xl font-black text-[#F5F5F5] sm:text-3xl">
              {userStats.total_xp === null ? (profileLoadFailed ? "Unavailable" : "—") : userStats.total_xp.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#A1A1AA] sm:text-xs">XP</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#D8FF3E] transition-all duration-500"
              style={{ width: `${levelProgressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-[#A1A1AA]">
            {userStats.xp_to_next_level === null
              ? "Progress unavailable"
              : `${userStats.xp_to_next_level} XP to next level`}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="min-w-0 rounded-2xl border border-[#252525] bg-[#101010] p-3.5 sm:rounded-[24px] sm:p-5"
        >
          <div className="flex min-h-10 items-start justify-between gap-2 sm:items-center">
            <span className="text-[9px] font-semibold uppercase leading-relaxed tracking-[0.1em] text-[#A1A1AA] sm:text-xs sm:tracking-[0.2em]">Battles Completed</span>
            <div className="rounded-xl border border-[#D8FF3E]/40 bg-[#D8FF3E]/10 p-1.5 text-[#D8FF3E]">
              <Swords size={14} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="break-all text-2xl font-black text-[#F5F5F5] sm:text-3xl">
              {userStats.battles_count ?? (profileLoadFailed ? "Unavailable" : "—")}
            </span>
            <span className="text-[10px] text-[#A1A1AA] sm:text-xs">Total duels</span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[#A1A1AA] sm:text-xs">Persisted completed battle records</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="min-w-0 rounded-2xl border border-[#252525] bg-[#101010] p-3.5 sm:rounded-[24px] sm:p-5"
        >
          <div className="flex min-h-10 items-start justify-between gap-2 sm:items-center">
            <span className="text-[9px] font-semibold uppercase leading-relaxed tracking-[0.1em] text-[#A1A1AA] sm:text-xs sm:tracking-[0.2em]">Placement Score</span>
            <div className="rounded-xl border border-[#D8FF3E]/40 bg-[#D8FF3E]/10 p-1.5 text-[#D8FF3E]">
              <Gauge size={14} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="break-all text-2xl font-black text-[#F5F5F5] sm:text-3xl">
              {profileLoadFailed ? "Unavailable" : skillList.length ? `${averageSkill}%` : "No evidence"}
            </span>
            <span className="text-[10px] text-[#A1A1AA] sm:text-xs">Readiness</span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[#A1A1AA] sm:text-xs">Calculated from verified skill evidence</p>
        </motion.div>
      </section>

      {/* ── 3. Primary Modes Showcase (MCQ & Coding as dominant) ── */}
      <section className="space-y-4">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D8FF3E]">Dominant Modes</span>
            <h2 className="text-xl font-black text-white sm:text-2xl">Choose Your Battle Discipline</h2>
          </div>
          <span className="text-[11px] leading-relaxed text-slate-400 sm:text-xs">Question availability and rewards are determined by the server</span>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* MCQ Battle Primary Card */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-[#252525] bg-[#0b0b0b] p-4 sm:rounded-[28px] sm:p-7"
          >
            <div className="absolute top-0 right-0 h-40 w-40 bg-[#D8FF3E]/10 rounded-full blur-3xl group-hover:bg-[#D8FF3E]/20 transition-all duration-500" />
            
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D8FF3E]/35 bg-[#D8FF3E]/10 px-3 py-1 text-xs font-bold text-[#D8FF3E]">
                  <BookOpen size={13} />
                  Database-backed MCQ practice
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-black text-white group-hover:text-[#D8FF3E] transition">
                MCQ Practice
              </h3>

              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Answer eligible Computer Science questions retrieved from the database. Submitted answers are persisted to your account.
              </p>

            </div>

            <div className="mt-7">
              <button
                type="button"
                onClick={() => router.push("/battle/solo?mode=mcq")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D8FF3E] px-6 py-3.5 text-sm font-bold text-[#101010] shadow-[0_10px_30px_rgba(216,255,62,0.28)] transition hover:brightness-105 active:scale-[0.99]"
              >
                Launch MCQ Practice
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>

          {/* Coding Battle Primary Card */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-[#252525] bg-[#101010] p-4 sm:rounded-[28px] sm:p-7"
          >
            <div className="absolute top-0 right-0 h-40 w-40 bg-[#D8FF3E]/10 rounded-full blur-3xl group-hover:bg-[#D8FF3E]/20 transition-all duration-500" />

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D8FF3E]/30 bg-[#D8FF3E]/10 px-3 py-1 text-xs font-bold text-[#D8FF3E]">
                  <Code2 size={13} />
                  Competitive DSA IDE
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-slate-300 sm:text-xs">
                  Multiple language choices
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-black text-white group-hover:text-[#D8FF3E] transition">
                Coding Battle Arena
              </h3>

              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Create a coding battle from available database questions and submit work through the server-managed battle flow.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 text-center text-[10px] sm:text-xs">
                <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                  <p className="text-[10px] uppercase text-slate-400">Languages</p>
                  <p className="mt-1 font-bold text-white">Py, JS, C++, Java</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                  <p className="text-[10px] uppercase text-slate-400">Judge</p>
                  <p className="mt-1 font-bold text-[#D8FF3E]">Authoritative</p>
                </div>
              </div>
            </div>

            <div className="mt-7">
              <button
                type="button"
                onClick={() => router.push("/battle/solo?mode=coding")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D8FF3E] px-6 py-3.5 text-sm font-bold text-[#101010] shadow-[0_10px_30px_rgba(216,255,62,0.28)] transition hover:brightness-105 active:scale-[0.99]"
              >
                Launch Coding Battle
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 4. Secondary Competitions: 1v1 Queue & Tournaments ── */}
      <section className="grid gap-4 md:grid-cols-2 sm:gap-6">
        <div className="flex flex-col justify-between rounded-[24px] border border-[#252525] bg-[#101010] p-4 sm:rounded-[28px] sm:p-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D8FF3E]/30 bg-[#D8FF3E]/10 px-3 py-1 text-xs font-bold text-[#D8FF3E]">
                <Users size={12} />
                Live Matchmaking
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                Server queue
              </span>
            </div>

            <h3 className="mt-4 text-xl font-black text-white">Battle Matchmaking</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Join the server-managed queue. The backend creates a battle only when another player is matched; queueing does not guarantee an immediate opponent.
            </p>
          </div>

          <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center">
            <span className="text-xs text-slate-400">Server-managed matchmaking</span>
            <button
              type="button"
              onClick={() => router.push("/battle/lobby")}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[#D8FF3E]/30 bg-[#D8FF3E]/10 px-4 py-2 text-xs font-bold text-[#EAFCCB] transition hover:bg-[#D8FF3E]/20 hover:text-[#101010] sm:w-auto"
            >
              Open Matchmaking
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[24px] border border-[#252525] bg-[#101010] p-4 sm:rounded-[28px] sm:p-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                <Trophy size={12} />
                Championships
              </div>
              <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
              Available listings
              </span>
            </div>

            <h3 className="mt-4 text-xl font-black text-white">Placement Tournaments & Contests</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Browse available tournaments and placement assessments. Registration and results are provided by their authenticated services.
            </p>
          </div>

          <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center">
            <span className="text-xs text-slate-400">Available tournament records</span>
            <button
              type="button"
              onClick={() => router.push("/tournament")}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-600/20 px-4 py-2 text-xs font-bold text-amber-200 transition hover:bg-amber-600 hover:text-white sm:w-auto"
            >
              View Tournaments
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* ── 5. Skill Intelligence & Placement Readiness ── */}
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-[#252525] bg-[#101010] p-4 sm:rounded-[28px] sm:p-6"
        >
          <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D8FF3E]">Verified Skill Signals</p>
              <h3 className="mt-1 text-xl font-black text-white sm:text-2xl">Placement Competency Matrix</h3>
            </div>
            <div className="rounded-full border border-[#D8FF3E]/30 bg-[#D8FF3E]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D8FF3E]">
              {loading ? "Syncing" : "Server Verified"}
            </div>
          </div>

          <div className="space-y-3.5">
            {profileLoadFailed ? (
              <div role="alert" className="flex items-center justify-between gap-3 text-sm text-rose-300">
                <span>Skill evidence could not be retrieved from the server.</span>
                <button type="button" onClick={onRetry} className="font-bold underline">Retry</button>
              </div>
            ) : skillList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
                No skill signals recorded yet. Complete an MCQ or Coding battle to establish your verified placement matrix.
              </div>
            ) : (
              skillList.map((skill) => (
                <div key={skill.skill} className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{skill.skill}</span>
                      {skill.verified ? <ShieldCheck size={14} className="text-emerald-400" /> : null}
                    </div>
                    <span className="font-bold text-[#D8FF3E]">{skill.score}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#D8FF3E] transition-all duration-500"
                      style={{ width: `${Math.max(6, Math.min(100, skill.score))}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
                    <span>{skill.attempts} verified attempts</span>
                    <span>Recorded evidence</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* AI Guidance & Weakest Links */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between rounded-[24px] border border-[#252525] bg-[#101010] p-4 sm:rounded-[28px] sm:p-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-2.5 text-amber-300">
                <BrainCircuit size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200">Skill Gap Diagnosis</p>
                <h3 className="text-xl font-black text-white sm:text-2xl">Recommended Focus Areas</h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Based on your battle performance and assessment submissions, these subjects require reinforcement:
            </p>

            <div className="mt-4 space-y-2.5">
              {weakSkills.length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4 text-xs text-slate-400">
                  Complete battle challenges to diagnose your weaknesses.
                </div>
              ) : (
                weakSkills.map((skill) => (
                  <div key={skill.skill} className="rounded-2xl border border-white/5 bg-slate-950/60 p-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">{skill.skill}</p>
                      <p className="text-[11px] text-slate-400">{skill.attempts} attempts logged</p>
                    </div>
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                      {skill.score}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#D8FF3E]/20 bg-[#D8FF3E]/10 p-4">
            <div className="flex items-center gap-2 text-[#D8FF3E] text-xs font-bold uppercase tracking-wider">
              <Flame size={14} />
              <span>Recommended Next Move</span>
            </div>
            <p className="mt-2 text-xs text-slate-200 leading-relaxed">
              {weakSkills[0]?.skill
                ? `Launch an adaptive session targeting ${weakSkills[0].skill} to close this skill gap before placement evaluations.`
                : "Complete an available practice session to build verified skill evidence."}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/battle/solo?mode=mcq")}
                className="rounded-xl bg-[#D8FF3E]/15 border border-[#D8FF3E]/30 px-3 py-1.5 text-xs font-bold text-[#EAFCCB] hover:bg-[#D8FF3E]/25 transition"
              >
                Target with MCQ Practice →
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── 6. Recent Battle Activity (Real Authenticated Data) ── */}
      <section className="rounded-[28px] border border-white/10 bg-[#0b1220]/90 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D8FF3E]">Activity Log</p>
            <h3 className="mt-1 text-2xl font-black text-white">Recent Battle Activity</h3>
          </div>
          <button
            type="button"
            onClick={() => router.push("/analytics")}
            className="text-xs font-semibold text-[#D8FF3E] hover:text-[#EAFCCB] transition"
          >
            View Full Analytics →
          </button>
        </div>

        {historyLoadFailed ? (
          <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-8 text-center text-rose-200">
            <p>Battle history could not be retrieved from the server.</p>
            <button type="button" onClick={onRetry} className="mt-3 font-bold underline">Retry</button>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400 space-y-3">
            <p className="text-base font-semibold text-white">No battle history recorded yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Complete an available practice session or server-created coding battle to record activity and build verified skill evidence.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/battle/solo?mode=mcq")}
                className="rounded-xl bg-[#D8FF3E] px-4 py-2 text-xs font-bold text-[#101010] hover:bg-[#EAFCCB] transition"
              >
                Play MCQ Practice
              </button>
              <button
                type="button"
                onClick={() => router.push("/battle/solo?mode=coding")}
                className="rounded-xl bg-[#D8FF3E] px-4 py-2 text-xs font-bold text-[#101010] hover:bg-[#EAFCCB] transition"
              >
                Play Coding Battle
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pl-2">Battle</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Result</th>
                  <th className="pb-3">Verified XP</th>
                  <th className="pb-3 pr-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((item) => (
                  <tr key={item.battle_id} className="transition hover:bg-white/[0.02]">
                    <td className="py-3.5 pl-2 font-medium text-white">
                      {item.title || "Battle"}
                    </td>
                    <td className="py-3.5">
                      <span className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-slate-300">
                        {item.battle_type || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-white">
                      {item.score} pts
                    </td>
                    <td className="py-3.5">
                      {item.is_winner ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                          <CheckCircle2 size={12} /> Winner
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                          {item.rank ? `Rank #${item.rank}` : "Completed"}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 font-bold text-yellow-300">
                      +{item.xp_earned} XP
                    </td>
                    <td className="py-3.5 pr-2 text-right text-xs text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
