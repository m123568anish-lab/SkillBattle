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

type RecommendedBattle = {
  id: string;
  title?: string;
  difficulty?: string;
  status?: string;
  max_players?: number;
  created_at?: string;
};

type UserProfileStats = {
  rating: number;
  total_xp: number;
  level: number;
  battles_count: number;
  win_rate?: number;
};

export default function BattleArenaCommandCenter({
  skillList,
  averageSkill,
  weakSkills,
  loading,
  profileLoadFailed,
  waitingLoadFailed,
  recommendedBattle,
  recommendedBattleTitle,
  userStats,
  history,
}: {
  skillList: Skill[];
  averageSkill: number;
  weakSkills: Skill[];
  loading: boolean;
  profileLoadFailed: boolean;
  waitingLoadFailed: boolean;
  recommendedBattle: RecommendedBattle | null;
  recommendedBattleTitle: string;
  userStats: UserProfileStats;
  history: BattleHistoryItem[];
}) {
  const router = useRouter();

  // Rating Tier Calculation
  const getRatingTier = (rating: number) => {
    if (rating >= 1800) return { label: "Grandmaster", color: "text-amber-300 border-amber-400/30 bg-amber-500/10" };
    if (rating >= 1500) return { label: "Master", color: "text-rose-300 border-rose-400/30 bg-rose-500/10" };
    if (rating >= 1300) return { label: "Diamond", color: "text-cyan-300 border-cyan-400/30 bg-cyan-500/10" };
    if (rating >= 1100) return { label: "Platinum", color: "text-violet-300 border-violet-400/30 bg-violet-500/10" };
    return { label: "Competitor", color: "text-slate-300 border-slate-700 bg-slate-800/50" };
  };

  const ratingTier = getRatingTier(userStats.rating);
  const nextLevelXp = userStats.level * 500;
  const currentLevelXpProgress = userStats.total_xp % 500;
  const levelProgressPercent = Math.min(100, Math.round((currentLevelXpProgress / 500) * 100));

  return (
    <div className="space-y-8 pb-12 text-white">
      {/* ── 1. Hero Section ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] border border-cyan-500/25 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.18),_transparent_35%),linear-gradient(135deg,#070b14_0%,#0f172a_45%,#070b14_100%)] p-7 md:p-9 shadow-[0_24px_70px_rgba(6,182,212,0.12)]"
      >
        <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-cyan-200">
              <Swords size={13} className="text-cyan-300" />
              Battle Arena Command Center
            </div>

            <h1 className="text-4xl font-black tracking-[-0.04em] text-white md:text-5xl lg:text-6xl">
              Competitive Programming & <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">Assessment Center</span>
            </h1>

            <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg leading-relaxed">
              Step into high-stakes algorithmic duels, adaptive knowledge battles, and placement assessments evaluated by our server-authoritative judging engine.
            </p>
          </div>

          {/* Primary Quick Launch CTAs */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/battle/solo?mode=mcq")}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition hover:scale-[1.02] hover:shadow-cyan-500/20 active:scale-[0.99]"
            >
              <BookOpen size={16} />
              Start MCQ Battle
            </button>

            <button
              type="button"
              onClick={() => router.push("/battle/solo?mode=coding")}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:scale-[1.02] active:scale-[0.99]"
            >
              <Code2 size={16} />
              Start Coding Battle
            </button>

            <button
              type="button"
              onClick={() => router.push("/battle/queue")}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-bold text-slate-200 transition hover:border-cyan-400/50 hover:bg-white/10 hover:text-white"
            >
              <Users size={16} />
              1v1 Matchmaking
            </button>
          </div>
        </div>
      </motion.section>

      {/* ── Navigation Strip (No QuestMap) ── */}
      <nav aria-label="Battle Arena sections" className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3 text-sm">
        {[
          { label: "MCQ Battle", href: "/battle/solo?mode=mcq", icon: BookOpen },
          { label: "Coding Battle", href: "/battle/solo?mode=coding", icon: Code2 },
          { label: "Multiplayer Queue", href: "/battle/queue", icon: Users },
          { label: "Tournaments", href: "/tournaments", icon: Trophy },
          { label: "Placement Prep", href: "/battle/placement-prep", icon: ShieldCheck },
          { label: "Battle History", href: "/analytics", icon: TrendingUp },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/5 hover:text-cyan-200"
            >
              <Icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── 2. Competitive Profile Metrics ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="rounded-[24px] border border-white/10 bg-[#0d1526]/80 p-5 shadow-lg backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Competitive Rating</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ratingTier.color}`}>
              {ratingTier.label}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{userStats.rating}</span>
            <span className="text-xs text-slate-400">Elo points</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Earned in 1v1 ranked duels & solo challenges</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-[24px] border border-white/10 bg-[#0d1526]/80 p-5 shadow-lg backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Verified XP & Level</span>
            <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold text-violet-300">
              Level {userStats.level}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-yellow-300">{userStats.total_xp.toLocaleString()}</span>
            <span className="text-xs text-slate-400">XP</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${levelProgressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-slate-400">{500 - currentLevelXpProgress} XP to Level {userStats.level + 1}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-[24px] border border-white/10 bg-[#0d1526]/80 p-5 shadow-lg backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Battles Completed</span>
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-1.5 text-cyan-200">
              <Swords size={14} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{userStats.battles_count}</span>
            <span className="text-xs text-slate-400">Total duels</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Across MCQ, Coding, and Ranked matches</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="rounded-[24px] border border-white/10 bg-[#0d1526]/80 p-5 shadow-lg backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Placement Score</span>
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-1.5 text-emerald-200">
              <Gauge size={14} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-300">{averageSkill > 0 ? `${averageSkill}%` : "Ready"}</span>
            <span className="text-xs text-slate-400">Readiness</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Calculated from verified skill evidence</p>
        </motion.div>
      </section>

      {/* ── 3. Primary Modes Showcase (MCQ & Coding as dominant) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">Dominant Modes</span>
            <h2 className="text-2xl font-black text-white">Choose Your Battle Discipline</h2>
          </div>
          <span className="text-xs text-slate-400">Server verified • Instant XP • Real-time judge</span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* MCQ Battle Primary Card */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="group relative overflow-hidden rounded-[28px] border border-violet-500/25 bg-gradient-to-br from-violet-950/40 via-slate-900/90 to-[#0c1222] p-7 shadow-xl shadow-violet-950/20 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 h-40 w-40 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all duration-500" />
            
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-300">
                  <BookOpen size={13} />
                  Adaptive Knowledge Sprint
                </span>
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
                  10 Questions • +150 XP
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-black text-white group-hover:text-violet-200 transition">
                MCQ Battle Arena
              </h3>

              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Test your mastery of core Computer Science: Algorithms, Data Structures, System Design, SQL, OOP, OS, and Networking. Features adaptive timing, immediate solution review, and placement readiness verification.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                  <p className="text-[10px] uppercase text-slate-400">Pace</p>
                  <p className="mt-1 font-bold text-white">Adaptive</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                  <p className="text-[10px] uppercase text-slate-400">Questions</p>
                  <p className="mt-1 font-bold text-violet-300">10 Per Duel</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                  <p className="text-[10px] uppercase text-slate-400">Reward</p>
                  <p className="mt-1 font-bold text-yellow-300">+15 XP / correct</p>
                </div>
              </div>
            </div>

            <div className="mt-7">
              <button
                type="button"
                onClick={() => router.push("/battle/solo?mode=mcq")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110 active:scale-[0.99]"
              >
                Launch MCQ Battle
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>

          {/* Coding Battle Primary Card */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="group relative overflow-hidden rounded-[28px] border border-cyan-500/25 bg-gradient-to-br from-cyan-950/35 via-slate-900/90 to-[#0c1222] p-7 shadow-xl shadow-cyan-950/20 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 h-40 w-40 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-500" />

            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-300">
                  <Code2 size={13} />
                  Competitive DSA IDE
                </span>
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
                  Multi-Language • +150 XP
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-black text-white group-hover:text-cyan-200 transition">
                Coding Battle Arena
              </h3>

              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Solve competitive programming challenges in Python, JavaScript, C++, or Java. Features real-time testcase execution, custom inputs, memory & runtime profiling, and server-verified XP awards.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                  <p className="text-[10px] uppercase text-slate-400">Languages</p>
                  <p className="mt-1 font-bold text-white">Py, JS, C++, Java</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                  <p className="text-[10px] uppercase text-slate-400">Judge</p>
                  <p className="mt-1 font-bold text-cyan-300">Authoritative</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                  <p className="text-[10px] uppercase text-slate-400">Max XP</p>
                  <p className="mt-1 font-bold text-yellow-300">+150 XP</p>
                </div>
              </div>
            </div>

            <div className="mt-7">
              <button
                type="button"
                onClick={() => router.push("/battle/solo?mode=coding")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition hover:brightness-110 active:scale-[0.99]"
              >
                Launch Coding Battle
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 4. Secondary Competitions: 1v1 Queue & Tournaments ── */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-[#0d1627]/90 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300">
                <Users size={12} />
                Live Matchmaking
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                Live Queue Active
              </span>
            </div>

            <h3 className="mt-4 text-xl font-black text-white">1v1 Multiplayer Ranked Queue</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Queue into an instant duel with a live opponent of similar rating. Race to solve algorithmic problems with WebSocket synchronizations and real-time scoreboard broadcasts.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
            <span className="text-xs text-slate-400">Stakes: ±25 Rating • Anti-Cheat Telemetry</span>
            <button
              type="button"
              onClick={() => router.push("/battle/queue")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-4 py-2 text-xs font-bold text-indigo-200 transition hover:bg-indigo-600 hover:text-white"
            >
              Enter Queue
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#0d1627]/90 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                <Trophy size={12} />
                Championships
              </div>
              <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                Scheduled & On-Demand
              </span>
            </div>

            <h3 className="mt-4 text-xl font-black text-white">Placement Tournaments & Contests</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Participate in institutional placement assessments, company speedruns, and official SkillBattle championship tournaments with verified leaderboard rankings.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
            <span className="text-xs text-slate-400">Institutional & Public Tournaments</span>
            <button
              type="button"
              onClick={() => router.push("/tournaments")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-600/20 px-4 py-2 text-xs font-bold text-amber-200 transition hover:bg-amber-600 hover:text-white"
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
          className="rounded-[28px] border border-white/10 bg-[#0b1220]/90 p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">Verified Skill Signals</p>
              <h3 className="mt-1 text-2xl font-black text-white">Placement Competency Matrix</h3>
            </div>
            <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
              {loading ? "Syncing" : "Server Verified"}
            </div>
          </div>

          <div className="space-y-3.5">
            {profileLoadFailed ? (
              <p role="alert" className="text-sm text-rose-300">Skill evidence could not be retrieved from the server.</p>
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
                    <span className="font-bold text-cyan-300">{skill.score}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500 transition-all duration-500"
                      style={{ width: `${Math.max(6, Math.min(100, skill.score))}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
                    <span>{skill.attempts} verified attempts</span>
                    <span>{skill.score >= 70 ? "Placement Ready" : "Target Practice"}</span>
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
          className="rounded-[28px] border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-slate-900/90 to-[#0d1627] p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-2.5 text-amber-300">
                <BrainCircuit size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200">Skill Gap Diagnosis</p>
                <h3 className="text-2xl font-black text-white">Recommended Focus Areas</h3>
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

          <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Flame size={14} />
              <span>Recommended Next Move</span>
            </div>
            <p className="mt-2 text-xs text-slate-200 leading-relaxed">
              {weakSkills[0]?.skill
                ? `Launch an adaptive session targeting ${weakSkills[0].skill} to close this skill gap before placement evaluations.`
                : "Play a quick 10-question MCQ battle or algorithmic duel to refresh your live skill profile."}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/battle/solo?mode=mcq")}
                className="rounded-xl bg-cyan-500/20 border border-cyan-400/30 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/30 transition"
              >
                Target with MCQ Sprint →
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── 6. Recent Battle Activity (Real Authenticated Data) ── */}
      <section className="rounded-[28px] border border-white/10 bg-[#0b1220]/90 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">Activity Log</p>
            <h3 className="mt-1 text-2xl font-black text-white">Recent Battle Activity</h3>
          </div>
          <button
            type="button"
            onClick={() => router.push("/analytics")}
            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
          >
            View Full Analytics →
          </button>
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400 space-y-3">
            <p className="text-base font-semibold text-white">No battle history recorded yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Launch your first MCQ Battle or Coding challenge to record match results, earn verified XP, and establish your placement evidence.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/battle/solo?mode=mcq")}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition"
              >
                Play MCQ Battle
              </button>
              <button
                type="button"
                onClick={() => router.push("/battle/solo?mode=coding")}
                className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition"
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
                      {item.title || "Competitive Battle"}
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
                          Rank #{item.rank || 1}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 font-bold text-yellow-300">
                      +{item.xp_earned} XP
                    </td>
                    <td className="py-3.5 pr-2 text-right text-xs text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Recent"}
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
