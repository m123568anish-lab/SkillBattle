"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Flame,
  Gauge,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BattleMatchmakingClient from "@/components/battle/BattleMatchmakingClient";
import { api } from "@/lib/api";
import { battleService, type BattleRecord } from "@/services/battle.service";

type SkillProfile = {
  user_id?: string;
  placement_readiness_score?: number;
  confidence_level?: string;
  weak_areas?: string[];
  recommended_actions?: string[];
  programming_skills?: Record<string, number>;
  core_cs_skills?: Record<string, number>;
  practical_skills?: Record<string, number>;
};

const formatScore = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return `${Math.round(value)}%`;
};

export default function BattlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillProfile, setSkillProfile] = useState<SkillProfile | null>(null);
  const [waitingBattles, setWaitingBattles] = useState<BattleRecord[]>([]);

  const loadArenaData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [profileResult, battleResult] = await Promise.allSettled([
      api.get<SkillProfile>("/skills/profile"),
      battleService.getWaitingBattles(),
    ]);

    if (profileResult.status === "fulfilled") {
      setSkillProfile(profileResult.value.data);
    }

    if (battleResult.status === "fulfilled") {
      setWaitingBattles(battleResult.value ?? []);
    }

    const hasLiveData = profileResult.status === "fulfilled" || battleResult.status === "fulfilled";
    if (!hasLiveData) {
      const message =
        profileResult.status === "rejected" && battleResult.status === "rejected"
          ? "Unable to load battle data right now. Please try again."
          : "The arena is partially unavailable. Some live data could not be loaded.";
      setError(message);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadArenaData();
  }, [loadArenaData]);

  const skillMetrics = useMemo(() => {
    const sections = [
      ...(skillProfile?.programming_skills ? Object.entries(skillProfile.programming_skills).map(([label, score]) => ({ label, score })) : []),
      ...(skillProfile?.core_cs_skills ? Object.entries(skillProfile.core_cs_skills).map(([label, score]) => ({ label, score })) : []),
      ...(skillProfile?.practical_skills ? Object.entries(skillProfile.practical_skills).map(([label, score]) => ({ label, score })) : []),
    ];

    return sections.slice(0, 6);
  }, [skillProfile]);

  const primaryWeakAreas = skillProfile?.weak_areas?.slice(0, 4) ?? ["SQL", "Data Structures & Algorithms", "Problem Solving", "System Design"];

  const recommendedBattle = skillProfile?.weak_areas && skillProfile.weak_areas.length > 0 ? "Adaptive Placement Battle" : "Daily Placement Battle";
  const recommendedReason =
    skillProfile?.weak_areas && skillProfile.weak_areas.length > 0
      ? `Your recent performance shows weaker signals in ${skillProfile.weak_areas.slice(0, 2).join(" and ")}. A targeted adaptive battle will reinforce those areas before your next placement mock.`
      : "Your recent performance is balanced. A daily adaptive battle will keep your placement readiness trending upward.";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-slate-950 to-cyan-950/40 p-6 text-white shadow-2xl shadow-violet-950/20 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.18),_transparent_30%)]" />
          <div className="relative z-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-violet-300">⚔ Battle Arena</p>
                <h1 className="mt-3 text-3xl font-black sm:text-4xl">Improve your placement skills through intelligent challenges.</h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                  Train in focused solo battles, find a live multiplayer match, and use your real evidence to target the skills most likely to lift your placement readiness.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-300">
                <ShieldCheck size={16} className="text-emerald-400" />
                {skillProfile?.confidence_level ? `Confidence: ${skillProfile.confidence_level}` : "Live performance data"}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Current streak", value: "--", icon: Flame, accent: "text-orange-300" },
                { label: "Battle rating", value: formatScore(skillProfile?.placement_readiness_score), icon: Trophy, accent: "text-yellow-300" },
                { label: "XP", value: "--", icon: Zap, accent: "text-cyan-300" },
                { label: "Live queue", value: `${waitingBattles.length} open`, icon: Swords, accent: "text-violet-300" },
              ].map(({ label, value, icon: Icon, accent }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</span>
                    <Icon className={`h-4 w-4 ${accent}`} />
                  </div>
                  <div className="mt-3 text-2xl font-black text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadArenaData()}
              className="ml-auto rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 font-semibold text-rose-100 hover:bg-rose-500/15"
            >
              Retry
            </button>
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-violet-950/20">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">Choose your battle</p>
                <h2 className="mt-2 text-2xl font-black text-white">Train for placement, or compete live.</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/battle/solo")}
                className="group rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/15 via-slate-950 to-violet-500/10 p-5 text-left transition hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300">
                    <Target size={22} />
                  </div>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Solo</span>
                </div>
                <h3 className="mt-5 text-2xl font-black text-white">Solo Battle</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Train on adaptive placement questions, daily battle rounds, and weak-skill reinforcement based on your performance evidence.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">
                  Start solo battle <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => router.push("/battle/new")}
                className="group rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/15 via-slate-950 to-fuchsia-500/10 p-5 text-left transition hover:border-violet-400/60 hover:shadow-lg hover:shadow-violet-500/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
                    <Swords size={22} />
                  </div>
                  <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">Live</span>
                </div>
                <h3 className="mt-5 text-2xl font-black text-white">Multiplayer Battle</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Jump into real-time ranked or friend matches, keep a competitive streak, and use live ranking to push your skill ceiling.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-violet-300">
                  Find a match <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-violet-950/20">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.35em] text-violet-300">
              <BrainCircuit size={14} />
              Recommended battle
            </div>
            <h3 className="mt-4 text-2xl font-black text-white">{recommendedBattle}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{recommendedReason}</p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Focus</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(skillProfile?.weak_areas ?? ["Hashing", "Time Complexity", "Problem Solving"]).slice(0, 3).map((area) => (
                  <span key={area} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-200">
                    {area}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/battle/solo")}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-950/40 hover:opacity-90"
            >
              Start recommended battle <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-violet-950/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">Battle intelligence</p>
                <h3 className="mt-2 text-2xl font-black text-white">Skill health</h3>
              </div>
              <Gauge className="h-5 w-5 text-cyan-300" />
            </div>

            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">Loading your skill profile…</div>
              ) : skillMetrics.length > 0 ? (
                skillMetrics.map(({ label, score }) => (
                  <div key={label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span className="capitalize">{label.replace(/_/g, " ")}</span>
                      <span>{formatScore(score)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500"
                        style={{ width: `${Math.min(Math.max(score ?? 0, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">
                  No skill evidence is available yet. Complete a battle or assessment to unlock placement intelligence.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-violet-950/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-300">Weak skills</p>
                <h3 className="mt-2 text-2xl font-black text-white">What needs attention</h3>
              </div>
              <TrendingUp className="h-5 w-5 text-amber-300" />
            </div>

            <div className="mt-5 space-y-3">
              {primaryWeakAreas.map((area) => (
                <div key={area} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-white">{area}</span>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Focus</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Practice targeted sessions and revisit the concepts behind this skill before your next assessment.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-violet-950/20">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-300">Placement readiness</p>
              <h3 className="mt-2 text-2xl font-black text-white">Readiness snapshot</h3>
            </div>
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-200">
              {formatScore(skillProfile?.placement_readiness_score)}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                <span>Overall placement readiness</span>
                <span className="font-bold text-white">{formatScore(skillProfile?.placement_readiness_score)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500"
                  style={{ width: `${Math.min(Math.max(skillProfile?.placement_readiness_score ?? 0, 0), 100)}%` }}
                />
              </div>
              <p className="mt-4 text-sm text-slate-400">
                {skillProfile?.recommended_actions?.length
                  ? skillProfile.recommended_actions[0]
                  : "Use your next battle to improve metric consistency and reduce weak-skill volatility."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Next recommended actions</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {(skillProfile?.recommended_actions ?? ["Complete a timed solo battle", "Practice weak-skill drills", "Join a live multiplayer match"]).slice(0, 3).map((action) => (
                  <li key={action} className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <BattleMatchmakingClient />
      </div>
    </DashboardLayout>
  );
}