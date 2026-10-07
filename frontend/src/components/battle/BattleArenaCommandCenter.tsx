"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Flame,
  Gauge,
  ShieldCheck,
  Swords,
  Target,
  TrendingUp,
} from "lucide-react";

import BattleQuestMap from "@/components/battle/BattleQuestMap";

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

type BattleMode = {
  title: string;
  description: string;
  accent: string;
  href: string;
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
  arenaModes,
}: {
  skillList: Skill[];
  averageSkill: number;
  weakSkills: Skill[];
  loading: boolean;
  profileLoadFailed: boolean;
  waitingLoadFailed: boolean;
  recommendedBattle: RecommendedBattle | null;
  recommendedBattleTitle: string;
  arenaModes: BattleMode[];
}) {
  const router = useRouter();

  const primaryStats = [
    {
      label: "Total skill score",
      value: profileLoadFailed ? "Unavailable" : skillList.length ? `${averageSkill}%` : "No data",
      icon: TrendingUp,
      className: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
    },
    {
      label: "Verified attempts",
      value: profileLoadFailed ? "Unavailable" : `${skillList.reduce((total, skill) => total + skill.attempts, 0)}`,
      icon: BadgeCheck,
      className: "border-violet-400/20 bg-violet-500/10 text-violet-200",
    },
    {
      label: "Focus area",
      value: profileLoadFailed ? "Unavailable" : weakSkills[0]?.skill ?? "No data",
      icon: Target,
      className: "border-amber-400/20 bg-amber-500/10 text-amber-200",
    },
  ];

  return (
    <div className="space-y-8 pb-8 text-white">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] border border-cyan-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),radial-gradient(circle_at_right,_rgba(59,130,246,0.22),_transparent_30%),linear-gradient(135deg,#0b1120_0%,#111827_30%,#090d18_100%)] p-7 shadow-[0_30px_80px_rgba(14,116,144,0.18)]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)]" />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200">
              <Swords size={12} />
              Battle Arena
            </div>

            <h1 className="text-4xl font-black tracking-[-0.06em] text-white md:text-5xl">
              Battle Arena Command Center
            </h1>

            <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
              Train, compete, improve, and track the evidence behind your next placement-ready move.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/battle/solo")}
              className="rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition hover:scale-[1.01]"
            >
              Solo Battle
            </button>

            <button
              type="button"
              onClick={() => router.push("/battle/queue")}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              Multiplayer Queue
            </button>
          </div>
        </div>
      </motion.section>

      <nav aria-label="Battle Arena sections" className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3 text-sm">
        {[
          { label: "Solo Battle", href: "/battle/solo" },
          { label: "Multiplayer", href: "/battle/queue" },
          { label: "Quest Map", href: "#quest-map" },
          { label: "Daily Battle", href: "/battle/solo" },
          { label: "Skill Battles", href: "/battle/create" },
          { label: "Placement Battles", href: "/battle/placement-prep" },
          { label: "Battle History", href: "/analytics" },
        ].map((item) => (
          <Link key={`${item.label}-${item.href}`} href={item.href} className="shrink-0 rounded-md border border-white/10 px-3 py-2 text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100">
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="grid gap-4 md:grid-cols-3">
        {arenaModes.length ? (
          arenaModes.map((mode) => (
            <button
              key={mode.title}
              type="button"
              onClick={() => mode.href.startsWith("#") ? document.getElementById("quest-map")?.scrollIntoView({ behavior: "smooth" }) : router.push(mode.href)}
              className={`group rounded-[24px] border border-white/10 bg-gradient-to-br ${mode.accent} p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/30`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-300">Arena mode</span>
                <ArrowRight size={16} className="text-cyan-200 transition group-hover:translate-x-0.5" />
              </div>
              <h3 className="mt-4 text-xl font-black text-white">{mode.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{mode.description}</p>
            </button>
          ))
        ) : (
          <div className="md:col-span-3 rounded-[24px] border border-dashed border-white/15 bg-slate-950/40 p-6 text-slate-300">
            No battle modes are currently available. Use Solo Battle, Coding Quest, or the queue to start the next real session.
          </div>
        )}
      </section>

      <BattleQuestMap />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <motion.article
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[28px] border border-white/10 bg-[#0d1729]/90 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.35)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-300">Recommended battle</p>
              <h2 className="mt-2 text-2xl font-black text-white">{recommendedBattleTitle}</h2>
            </div>
            <div className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${recommendedBattle ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-slate-400"}`}>
              {recommendedBattle?.status ?? (waitingLoadFailed ? "Unavailable" : "No battle available")}
            </div>
          </div>

          {recommendedBattle ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Mode</p>
                <p className="mt-2 text-lg font-bold text-white">{recommendedBattle.max_players && recommendedBattle.max_players > 1 ? "Multiplayer" : "Solo"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Difficulty</p>
                <p className="mt-2 text-lg font-bold text-white">{recommendedBattle.difficulty ?? "Medium"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Players</p>
                <p className="mt-2 text-lg font-bold text-white">{recommendedBattle.max_players ?? 1}</p>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-400">
              {waitingLoadFailed ? "Open battles could not be loaded." : "No battle available right now. Start a solo battle or continue a Coding Quest session."}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/battle/solo")}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-500/25"
            >
              Enter battle
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => router.push("/battle/queue")}
              className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-3 font-semibold text-slate-200"
            >
              Join queue
            </button>
          </div>
        </motion.article>

        <motion.aside
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-[28px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-200">Average recorded skill</p>
              <h3 className="mt-2 text-3xl font-black text-white">{profileLoadFailed ? "Unavailable" : skillList.length ? `${averageSkill}%` : "No data"}</h3>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-3 text-emerald-200">
              <Gauge size={22} />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-sm text-slate-300">Skill evidence is calculated from completed practice and assessment activity.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Verified skill signals</p>
                <p className="mt-2 text-xl font-black text-white">{profileLoadFailed ? "Unavailable" : skillList.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Recorded attempts</p>
                <p className="mt-2 text-xl font-black text-white">{profileLoadFailed ? "Unavailable" : skillList.reduce((total, skill) => total + skill.attempts, 0)}</p>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {primaryStats.map(({ label, value, icon: Icon, className }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[24px] border border-white/10 bg-[#0d1729]/80 p-5"
          >
            <div className={`inline-flex rounded-xl border p-3 ${className}`}>
              <Icon size={18} />
            </div>
            <p className="mt-4 text-sm uppercase tracking-[0.22em] text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-black text-white">{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-white/10 bg-[#0b1220]/90 p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">Skill health</p>
              <h3 className="mt-2 text-2xl font-black text-white">Live skill profile</h3>
            </div>
            <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
              {loading ? "Syncing" : "Updated"}
            </div>
          </div>

          <div className="space-y-4">
            {profileLoadFailed ? (
              <p role="alert" className="text-sm text-rose-200">Skill evidence could not be loaded.</p>
            ) : skillList.length === 0 ? (
              <p className="text-sm text-slate-400">No verified skill evidence yet. Complete a practice problem or assessment to build your profile.</p>
            ) : (
              skillList.map((skill) => (
                <div key={skill.skill} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{skill.skill}</span>
                      {skill.verified ? <ShieldCheck size={14} className="text-emerald-300" /> : null}
                    </div>
                    <span className="font-bold text-cyan-200">{skill.score}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500"
                      style={{ width: `${Math.max(8, Math.min(100, skill.score))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-amber-200">
              <BrainCircuit size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200">AI guidance</p>
              <h3 className="mt-1 text-2xl font-black text-white">Weakest links</h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {profileLoadFailed ? (
              <p role="alert" className="text-sm text-rose-200">Skill guidance is unavailable because the profile could not be loaded.</p>
            ) : weakSkills.length === 0 ? (
              <p className="text-sm text-slate-400">Complete practice or an assessment to receive a data-based focus area.</p>
            ) : (
              weakSkills.map((skill) => (
                <div key={skill.skill} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{skill.skill}</p>
                      <p className="text-xs text-slate-400">{skill.attempts} attempts logged</p>
                    </div>
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-200">{skill.score}%</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <div className="flex items-center gap-2 text-cyan-200">
              <Flame size={16} />
              <span className="text-sm font-bold uppercase tracking-[0.2em]">Practice focus</span>
            </div>
            <p className="mt-2 text-sm text-slate-200">
              {weakSkills[0]?.skill ? `Target ${weakSkills[0].skill} with a focused Coding Quest or adaptive solo round.` : "Complete a real battle to generate your next recommended practice target."}
            </p>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
