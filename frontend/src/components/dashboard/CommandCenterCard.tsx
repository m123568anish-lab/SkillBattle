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
    <section className="rounded-[28px] border border-[#252525] bg-[#101010] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.2)] sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[#252525] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[#D8FF3E]/25 bg-[#D8FF3E]/10 p-2.5 text-[#D8FF3E]">
            <Compass size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D8FF3E]">Intelligence Hub</p>
            <h2 className="text-xl font-black text-[#F5F5F5] sm:text-2xl">Student Command Center</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D8FF3E]/30 bg-[#D8FF3E]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D8FF3E]">
            <ShieldCheck size={13} className="text-[#D8FF3E]" />
            {readiness} Readiness
          </span>
        </div>
      </div>

      {/* Hero Row: Next Best Action & Placement Signal */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Next Best Action Card */}
        <div className="relative overflow-hidden rounded-2xl border border-[#252525] bg-[#0B0B0B] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A1A1AA]">
              Target Priority Action
            </span>
            <span className="rounded-md border border-[#D8FF3E]/25 bg-[#D8FF3E]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#D8FF3E]">
              Recommended
            </span>
          </div>

          <h3 className="text-lg font-bold tracking-tight text-[#F5F5F5] sm:text-xl">
            {nextBest?.title ?? "Set your next study target"}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
            {nextBest?.why ?? "Complete a competitive battle or OA assessment to generate your personalized next step."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/battle"
              className="inline-flex items-center gap-2 rounded-xl bg-[#D8FF3E] px-4 py-2.5 text-xs font-bold text-[#101010] transition hover:bg-[#EAFCCB]"
            >
              <span>Start Battle</span>
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/assessments"
              className="inline-flex items-center gap-2 rounded-xl border border-[#252525] bg-[#101010] px-4 py-2.5 text-xs font-semibold text-[#F5F5F5] transition hover:bg-[#151515]"
            >
              <span>Practice OA</span>
            </Link>
          </div>
        </div>

        {/* Placement Signals Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#252525] bg-[#0B0B0B] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1AA]">Placement Intelligence</p>

          <div className="space-y-3.5 my-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#A1A1AA]">Readiness Status</span>
              <span className="text-xs font-bold uppercase tracking-wide text-[#D8FF3E]">{readiness}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#A1A1AA]">Algorithm Confidence</span>
              <span className="text-xs font-bold uppercase tracking-wide text-[#F0BC58]">{confidence}</span>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-[#A1A1AA]">Roadmap Progress</span>
                <span className="font-bold text-[#F5F5F5]">{roadmapProgress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#252525]">
                <div
                  className="h-full rounded-full bg-[#D8FF3E]"
                  style={{ width: `${Math.min(100, roadmapProgress)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#252525] pt-2 text-[11px] text-[#A1A1AA]">
            <span>Study time today</span>
            <span className="font-semibold text-[#F5F5F5]">{commandCenter.study_hours?.minutes ?? 0} min</span>
          </div>
        </div>
      </div>

      {/* Daily Actions List */}
      {actionList.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1AA]">Daily Recommended Tasks</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {actionList.slice(0, 3).map((action) => (
              <div
                key={`${action.type}-${action.title}`}
                className="rounded-2xl border border-[#252525] bg-[#0B0B0B] p-4 transition hover:border-[#D8FF3E]/25"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md border border-[#252525] bg-[#101010] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D8FF3E]">
                    {action.type}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-[#A1A1AA]">
                    <Clock size={11} />
                    {action.time}
                  </span>
                </div>
                <h4 className="mt-2.5 text-sm font-bold tracking-tight text-[#F5F5F5]">{action.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-[#A1A1AA]">{action.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Skill Gaps & Study Metrics */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-[#252525] bg-[#0B0B0B] p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#F0BC58]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1AA]">Priority Skill Gaps</p>
          </div>
          <div className="space-y-2.5">
            {gaps.length === 0 ? (
              <p className="py-2 text-xs text-[#A1A1AA]">No critical skill gaps identified. Keep up the high performance!</p>
            ) : (
              gaps.slice(0, 3).map((gap) => (
                <div
                  key={gap.skill_id ?? gap.skill_name}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[#252525] bg-[#101010] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-bold text-[#F5F5F5]">{gap.skill_name}</span>
                      <span className="rounded border border-[#F0BC58]/20 bg-[#F0BC58]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#F0BC58]">
                        {gap.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-[#A1A1AA]">{gap.reason}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#252525] bg-[#0B0B0B] p-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} className="text-[#D8FF3E]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1AA]">Active Study Metrics</p>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-[#252525] bg-[#101010] p-2.5">
                <span className="font-medium text-[#A1A1AA]">Focused Study Time</span>
                <span className="font-bold text-[#F5F5F5]">{commandCenter.study_hours?.minutes ?? 0} minutes</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#252525] bg-[#101010] p-2.5">
                <span className="font-medium text-[#A1A1AA]">Session XP Gained</span>
                <span className="font-bold text-[#D8FF3E]">+{commandCenter.student_state?.xp ?? 0} XP</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#252525] bg-[#101010] p-2.5">
                <span className="font-medium text-[#A1A1AA]">Active Streak</span>
                <span className="font-bold text-[#F0BC58]">{commandCenter.student_state?.streak ?? 0} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
