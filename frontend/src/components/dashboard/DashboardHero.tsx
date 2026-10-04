"use client";

import { motion } from "framer-motion";
import { Trophy, Target, Shield, Zap, Sparkles, TrendingUp, Clock, ChevronRight, Star } from "lucide-react";
import XPProgress from "./XPProgress";
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
  const winRate = stats.battles_played === 0
    ? 0
    : Math.round((stats.battles_won / stats.battles_played) * 100);
  const recentAchievements = achievements.slice(0, 4);

  const momentum = [
    { label: "XP Progress", value: `${Math.min(100, Math.round((stats.xp / nextLevelXP) * 100))}%`, icon: Zap, color: "text-violet-400" },
    { label: "Win Rate", value: `${winRate}%`, icon: Target, color: "text-emerald-400" },
    { label: "Streak", value: `${stats.streak} days`, icon: Clock, color: "text-orange-400" },
    { label: "Rating", value: `${stats.rating}`, icon: Shield, color: "text-cyan-400" },
  ];

  return (
    <div className="space-y-6">
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
          <div className="flex flex-col sm:flex-row items-center gap-6 flex-1">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 opacity-70 blur-md animate-pulse" />
              <div className="relative rounded-3xl border border-white/20 bg-slate-950 p-1">
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username || "User")}&background=0F172A&color=06b6d4&size=128&bold=true`}
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
                  {user.full_name || user.username || "SkillBattle Player"}
                  <Sparkles size={20} className="text-cyan-400 animate-pulse" />
                </h1>
                <span className="self-center rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-1 text-xs font-bold text-cyan-400 uppercase tracking-widest">
                  Lv.{level} Player
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-400">
                @{user.username || "player"} · <span className="text-slate-500">{user.email}</span>
              </p>

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

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-[#090D1A]/40 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-white">Recent achievements</h2>
              <p className="text-xs text-slate-400 mt-0.5">Unlocked from real game activity</p>
            </div>
            <button
              onClick={() => router.push("/achievements")}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>

          {recentAchievements.length > 0 ? (
            <div className="space-y-3">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-3"
                >
                  <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-300">
                    <Star size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">{achievement.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#070B14]/40 p-4 text-sm text-slate-400">
              No achievements yet. Finish your first battle or practice session to unlock one.
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-[#090D1A]/40 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-white">Current momentum</h2>
              <p className="text-xs text-slate-400 mt-0.5">Based on your real stats</p>
            </div>
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 text-xs font-bold text-violet-400">
              Live
            </div>
          </div>

          <div className="space-y-4">
            {momentum.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5">
                    <Icon size={16} className={color} />
                  </div>
                  <span className="text-sm font-semibold text-slate-300">{label}</span>
                </div>
                <span className="text-sm font-black text-white">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}