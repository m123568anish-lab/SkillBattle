"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Trophy, Target, Shield, Zap, Sparkles, TrendingUp, Clock, Star, Medal, BookOpen, Award, ChevronRight } from "lucide-react";
import XPProgress from "./XPProgress";
import type { UserSummary, DashboardStats } from "@/types/dashboard";
import { useRouter } from "next/navigation";
import { leaderboardService, type LeaderboardEntry } from "@/services/leaderboard.service";
import Image from "next/image";

interface DashboardHeroProps {
  user: UserSummary;
  stats: DashboardStats;
}

export default function DashboardHero({ user, stats }: DashboardHeroProps) {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const level = stats.level;
  const nextLevelXP = (level + 1) * 2500;
  const winRate = stats.battles_played === 0
    ? 0
    : Math.round((stats.battles_won / stats.battles_played) * 100);

  useEffect(() => {
    leaderboardService.getLeaderboard()
      .then((response) => setLeaderboard(response.leaderboard.slice(0, 10)))
      .catch(() => setLeaderboard([]));
  }, []);

  const progressMetrics = [
    { topic: "Battles completed", progress: Math.min(stats.battles_played, 100), color: "bg-cyan-500" },
    { topic: "Win rate", progress: winRate, color: "bg-emerald-500" },
    { topic: "30-day streak", progress: Math.min(Math.round((stats.streak / 30) * 100), 100), color: "bg-orange-500" },
    { topic: "XP to next level", progress: Math.min(Math.round((stats.xp / nextLevelXP) * 100), 100), color: "bg-violet-500" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Player Profile Hero ── */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-cyan-500/10 bg-gradient-to-br from-[#070B14] via-[#0F172A]/90 to-[#020617] p-3 shadow-2xl shadow-black/70 sm:rounded-2xl sm:p-5"
      >
        <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 items-center gap-4 xl:grid-cols-12 xl:gap-5">
          {/* Left: Avatar + Info */}
          <div className="flex min-w-0 flex-row items-center gap-3 sm:gap-4 xl:col-span-6">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 opacity-70 blur-md animate-pulse" />
              <div className="relative rounded-3xl border border-white/20 bg-slate-950 p-1">
                <Image
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=0F172A&color=06b6d4&size=128&bold=true`}
                  alt={user.full_name}
                  width={88}
                  height={88}
                  sizes="88px"
                  className="h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20"
                />
              </div>
              <span className="absolute -bottom-2 -right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-[10px] font-black text-white shadow-lg border border-cyan-400/40">
                {level}
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-1 text-left sm:space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                <h1 className="flex min-w-0 items-center gap-1.5 truncate text-lg font-black tracking-tight text-white sm:gap-2 sm:text-2xl">
                  {user.full_name}
                  <Sparkles size={20} className="text-cyan-400 animate-pulse flex-shrink-0" />
                </h1>
                <span className="hidden self-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400 sm:inline-flex">
                  Lv.{level} Player
                </span>
              </div>
              <p className="truncate text-xs font-semibold text-slate-400 sm:text-sm">
                @{user.username} <span className="hidden text-slate-500 sm:inline">· {user.email}</span>
              </p>

              {/* Quick stat row */}
              <div className="mt-1.5 flex max-w-full gap-1.5 overflow-x-auto pb-1 sm:mt-2 sm:flex-wrap sm:justify-start sm:gap-2 sm:overflow-visible sm:pb-0">
                {[
                  { icon: Trophy, label: `${stats.battles_won} Wins`, color: "text-yellow-400" },
                  { icon: Target, label: `${winRate}% Win Rate`, color: "text-emerald-400" },
                  { icon: Shield, label: `${stats.rating} Rating`, color: "text-cyan-400" },
                  { icon: Clock, label: `${stats.streak} Day Streak`, color: "text-orange-400" },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex shrink-0 items-center gap-1 rounded-lg border border-white/5 bg-white/5 px-2 py-1 text-[10px] font-semibold sm:px-2.5 sm:text-[11px]">
                    <Icon size={12} className={color} />
                    <span className="text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: XP + Stats */}
          <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center xl:col-span-6 xl:justify-end">
            <div className="w-full sm:w-auto flex-shrink-0">
              <XPProgress currentXP={stats.xp} nextLevelXP={nextLevelXP} />
            </div>
            <div className="grid w-full flex-shrink-0 grid-cols-2 gap-2 sm:w-52 sm:gap-2.5">
              {[
                { label: "XP Points", val: stats.xp.toLocaleString(), icon: Zap, color: "text-violet-400", border: "border-violet-500/20", glow: "hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:border-violet-500/40" },
                { label: "Rating", val: stats.rating, icon: Trophy, color: "text-yellow-400", border: "border-yellow-500/20", glow: "hover:shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:border-yellow-500/40" },
                { label: "Battles", val: stats.battles_played, icon: TrendingUp, color: "text-cyan-400", border: "border-cyan-500/20", glow: "hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:border-cyan-500/40" },
                { label: "Win Rate", val: `${winRate}%`, icon: Target, color: "text-emerald-400", border: "border-emerald-500/20", glow: "hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:border-emerald-500/40" },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className={`rounded-xl border ${card.border} bg-[#070B14]/40 p-2.5 backdrop-blur-xl transition-all duration-300 sm:p-3 ${card.glow}`}>
                    <Icon size={14} className={`${card.color} mb-1`} />
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
          className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-[#090D1A]/40 p-4 backdrop-blur-xl sm:rounded-3xl sm:p-6"
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
            {leaderboard.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">
                Leaderboard data is not available yet.
              </div>
            ) : leaderboard.map((player) => (
              <div
                key={player.rank}
                className={`${player.rank > 4 ? "hidden sm:flex" : "flex"} items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
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
                <span className="text-xs font-semibold text-slate-400">{player.solved} solved</span>
                <span className="ml-2 text-xs font-black text-cyan-300">{player.xp.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Study Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-[#090D1A]/40 p-4 backdrop-blur-xl sm:rounded-3xl sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-white">Study Activity</h2>
              <p className="text-xs text-slate-400 mt-0.5">Based on your live account activity</p>
            </div>
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 text-xs font-bold text-violet-400">
              <BookOpen size={12} className="inline mr-1" />
              Active
            </div>
          </div>
          <div className="space-y-4">
            {progressMetrics.map(({ topic, progress, color }, index) => (
              <div key={topic} className={index > 2 ? "hidden sm:block" : ""}>
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