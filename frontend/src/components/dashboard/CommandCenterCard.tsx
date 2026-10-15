import Link from "next/link";
import { Compass, Target, ArrowRight, ShieldCheck, AlertCircle, BookOpen, Clock } from "lucide-react";
import type { DashboardCommandCenter } from "@/services/dashboard.service";

export default function CommandCenterCard({ commandCenter }: { commandCenter?: DashboardCommandCenter }) {
  if (!commandCenter) {
    return null;
  }

  const nextBest = commandCenter.next_best_action;
  const actionList = commandCenter.daily_actions ?? [];
  const gaps = commandCenter.skill_gaps ?? [];
  const readiness = commandCenter.placement_readiness?.state ?? "BUILDING";
  const confidence = commandCenter.placement_readiness?.confidence ?? "LOW";
  const roadmapProgress = commandCenter.roadmap?.progress ?? 0;

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6 sm:p-8 shadow-2xl shadow-black/50">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-cyan-400">
            <Compass size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400">Intelligence Hub</p>
            <h2 className="text-xl sm:text-2xl font-black text-white">Student Command Center</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
            <ShieldCheck size={13} className="text-cyan-400" />
            {readiness} Readiness
          </span>
        </div>
      </div>

      {/* Hero Row: Next Best Action & Placement Signal */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Next Best Action Card */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] via-[#060913] to-cyan-500/[0.04] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">
              Target Priority Action
            </span>
            <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-300 uppercase">
              Recommended
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {nextBest?.title ?? "Set your next study target"}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            {nextBest?.why ?? "Complete a competitive battle or OA assessment to generate your personalized next step."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/battle"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-600/30 transition"
            >
              <span>Start Battle</span>
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/assessments"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-2.5 text-xs font-semibold text-slate-200 transition"
            >
              <span>Practice OA</span>
            </Link>
          </div>
        </div>

        {/* Placement Signals Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-[#060913]/70 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Placement Intelligence</p>

          <div className="space-y-3.5 my-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Readiness Status</span>
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">{readiness}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Algorithm Confidence</span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">{confidence}</span>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-400">Roadmap Progress</span>
                <span className="font-bold text-white">{roadmapProgress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{ width: `${Math.min(100, roadmapProgress)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-slate-400">
            <span>Study time today</span>
            <span className="font-semibold text-white">{commandCenter.study_hours?.minutes ?? 0} min</span>
          </div>
        </div>
      </div>

      {/* Daily Actions List */}
      {actionList.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Daily Recommended Tasks</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {actionList.slice(0, 3).map((action) => (
              <div
                key={`${action.type}-${action.title}`}
                className="rounded-2xl border border-white/[0.06] bg-[#060913]/60 p-4 transition hover:border-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                    {action.type}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <Clock size={11} />
                    {action.time}
                  </span>
                </div>
                <h4 className="mt-2.5 text-sm font-bold text-white tracking-tight">{action.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{action.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Skill Gaps & Study Metrics */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-white/[0.06] bg-[#060913]/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-amber-400" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Priority Skill Gaps</p>
          </div>
          <div className="space-y-2.5">
            {gaps.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No critical skill gaps identified. Keep up the high performance!</p>
            ) : (
              gaps.slice(0, 3).map((gap) => (
                <div
                  key={gap.skill_id ?? gap.skill_name}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate">{gap.skill_name}</span>
                      <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                        {gap.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 leading-snug">{gap.reason}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#060913]/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} className="text-cyan-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Active Study Metrics</p>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-2.5">
                <span className="text-slate-400 font-medium">Focused Study Time</span>
                <span className="font-bold text-white">{commandCenter.study_hours?.minutes ?? 0} minutes</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-2.5">
                <span className="text-slate-400 font-medium">Session XP Gained</span>
                <span className="font-bold text-violet-300">+{commandCenter.student_state?.xp ?? 0} XP</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-2.5">
                <span className="text-slate-400 font-medium">Active Streak</span>
                <span className="font-bold text-orange-400">{commandCenter.student_state?.streak ?? 0} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
