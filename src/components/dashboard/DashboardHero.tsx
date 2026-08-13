"use client";

import { motion } from "framer-motion";
import { Trophy, Target, Shield, Zap, Sparkles, TrendingUp, Clock, Star, Medal, BookOpen, Award, ChevronRight } from "lucide-react";
import XPProgress from "./XPProgress";
import type { UserSummary, DashboardStats } from "@/types/dashboard";
import { useRouter } from "next/navigation";

interface DashboardHeroProps {
  user: UserSummary;
  stats: DashboardStats;
}

// Fake top-10 leaderboard (in production this would come from /leaderboard API)
const MOCK_LEADERBOARD = [
  { rank: 1, username: "AlgoMaster", rating: 2850, winRate: 94 },
  { rank: 2, username: "CodeKing", rating: 2780, winRate: 91 },
  { rank: 3, username: "ByteWizard", rating: 2700, winRate: 88 },
  { rank: 4, username: "NullPointer", rating: 2640, winRate: 85 },
  { rank: 5, username: "RecurseX", rating: 2580, winRate: 83 },
  { rank: 6, username: "HashSet", rating: 2520, winRate: 80 },
  { rank: 7, username: "BitFlip", rating: 2460, winRate: 78 },
  { rank: 8, username: "StackBot", rating: 2390, winRate: 75 },
  { rank: 9, username: "TreeWalker", rating: 2340, winRate: 72 },
  { rank: 10, username: "DPGod", rating: 2280, winRate: 70 },
];

// Study topics progress (simulated)
const STUDY_TOPICS = [
  { topic: "Arrays & Strings", progress: 82, color: "bg-cyan-500" },
  { topic: "Trees & Graphs", progress: 65, color: "bg-violet-500" },
  { topic: "Dynamic Programming", progress: 48, color: "bg-amber-500" },
  { topic: "System Design", progress: 31, color: "bg-rose-500" },
  { topic: "SQL & DBMS", progress: 71, color: "bg-emerald-500" },
];

export default function DashboardHero({ user, stats }: DashboardHeroProps) {
  const router = useRouter();
  const level = stats.level;
  const nextLevelXP = (level + 1) * 2500;
  const winRate = stats.battles_played === 0
    ? 0
    : Math.round((stats.battles_won / stats.battles_played) * 100);

  return (
    <div className="space-y-6">
      {/* ── Player Profile Hero ── */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-[#070B14] via-[#0F172A]/90 to-[#020617] p-6 sm:p-8 relative overflow-hidden shadow-2xl shadow-black/70"
      >
        <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Avatar + Info */}
          <div className="flex flex-col sm:flex-row items-center gap-6 flex-1">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 opacity-70 blur-md animate-pulse" />
              <div className="relative rounded-3xl border border-white/20 bg-slate-950 p-1">
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=0F172A&color=06b6d4&size=128&bold=true`}
                  alt={user.full_name}
                  className="h-28 w-28 rounded-2xl object-cover"
                />
              </div>
              <span className="absolute -bottom-3 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-xs font-black text-white shadow-lg border border-cyan-400/40">
                {level}
              </span>
            </div>

            <div className="text-center sm:text-left space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
                <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl flex items-center gap-2 justify-center sm:justify-start">
                  {user.full_name}
                  <Sparkles size={20} className="text-cyan-400 animate-pulse" />
                </h1>
                <span className="self-center rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-1 text-xs font-bold text-cyan-400 uppercase tracking-widest">
                  Lv.{level} Player
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-400">
                @{user.username} · <span className="text-slate-500">{user.email}</span>
              </p>

              {/* Quick stat row */}
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start mt-3">
                {[
                  { icon: Trophy, label: `${stats.battles_won} Wins`, color: "text-yellow-400" },
                  { icon: Target, label: `${winRate}% Win Rate`, color: "text-emerald-400" },
                  { icon: Shield, label: `${stats.rating} Rating`, color: "text-cyan-400" },
                  { icon: Clock, label: `${stats.streak} Day Streak`, color: "text-orange-400" },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-semibold">
                    <Icon size={12} className={color} />
                    <span className="text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: XP + Stats */}
          <div className="flex flex-col md:flex-row items-center gap-6 justify-center lg:justify-end">
            <div className="w-full sm:w-auto">
              <XPProgress currentXP={stats.xp} nextLevelXP={nextLevelXP} />
            </div>
            <div className="grid grid-cols-2 gap-3.5 w-full md:w-64">
              {[
                { label: "XP Points", val: stats.xp.toLocaleString(), icon: Zap, color: "text-violet-400", border: "border-violet-500/20", glow: "hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:border-violet-500/40" },
                { label: "Rating", val: stats.rating, icon: Trophy, color: "text-yellow-400", border: "border-yellow-500/20", glow: "hover:shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:border-yellow-500/40" },
                { label: "Battles", val: stats.battles_played, icon: TrendingUp, color: "text-cyan-400", border: "border-cyan-500/20", glow: "hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:border-cyan-500/40" },
                { label: "Win Rate", val: `${winRate}%`, icon: Target, color: "text-emerald-400", border: "border-emerald-500/20", glow: "hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:border-emerald-500/40" },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className={`rounded-2xl border ${card.border} bg-[#070B14]/40 p-3.5 flex flex-col items-start backdrop-blur-xl transition-all duration-300 ${card.glow}`}>
                    <Icon size={15} className={`${card.color} mb-1.5`} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                    <span className="mt-0.5 text-base font-black text-white">{card.val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Bottom Row: Leaderboard + Study Activity ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Top 10 Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-[#090D1A]/40 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-white">Top 10 Leaderboard</h2>
              <p className="text-xs text-slate-400 mt-0.5">Global ranked players this week</p>
            </div>
            <button
              onClick={() => router.push("/leaderboard")}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition"
            >
              Full Board <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {MOCK_LEADERBOARD.map((player) => (
              <div
                key={player.rank}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                  player.username === user.username
                    ? "bg-cyan-500/10 border border-cyan-500/30"
                    : "bg-white/[0.03] border border-white/5 hover:bg-white/5"
                }`}
              >
                <span className={`text-xs font-black w-5 text-center ${
                  player.rank === 1 ? "text-yellow-400" :
                  player.rank === 2 ? "text-slate-300" :
                  player.rank === 3 ? "text-amber-600" :
                  "text-slate-500"
                }`}>
                  {player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : `#${player.rank}`}
                </span>
                <span className="flex-1 text-sm font-bold text-white truncate">{player.username}</span>
                <span className="text-xs font-semibold text-slate-400">{player.winRate}%</span>
                <span className="text-xs font-black text-cyan-300 ml-2">{player.rating.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Study Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-[#090D1A]/40 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-white">Study Activity</h2>
              <p className="text-xs text-slate-400 mt-0.5">Your topic mastery progress</p>
            </div>
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 text-xs font-bold text-violet-400">
              <BookOpen size={12} className="inline mr-1" />
              Active
            </div>
          </div>
          <div className="space-y-4">
            {STUDY_TOPICS.map(({ topic, progress, color }) => (
              <div key={topic}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">{topic}</span>
                  <span className="font-black text-white">{progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Achievements mini strip */}
          <div className="mt-5 pt-4 border-t border-white/5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              <Award size={11} className="inline mr-1" /> Recent Achievements
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "First Blood", icon: "⚔️" },
                { label: "10-Win Streak", icon: "🔥" },
                { label: "DSA Master", icon: "🧩" },
                { label: "Speed Coder", icon: "⚡" },
              ].map(({ label, icon }) => (
                <div key={label} className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-cyan-500/30 transition cursor-default">
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}