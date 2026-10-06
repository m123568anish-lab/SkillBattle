import Link from "next/link";
import type { DashboardCommandCenter } from "@/services/dashboard.service";

export default function CommandCenterCard({ commandCenter }: { commandCenter?: DashboardCommandCenter }) {
  if (!commandCenter) {
    return null;
  }

  const nextBest = commandCenter.next_best_action;
  const actionList = commandCenter.daily_actions ?? [];
  const gaps = commandCenter.skill_gaps ?? [];

  return (
    <div className="rounded-3xl border border-cyan-400/20 bg-slate-950/80 p-6 shadow-2xl shadow-cyan-950/20">
      <div className="flex flex-col gap-4 border-b border-slate-700/70 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300">Student command center</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Today</h2>
        </div>
        <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
          {commandCenter.placement_readiness?.state ?? "BUILDING"} readiness
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-violet-400/20 bg-violet-500/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-violet-300">Next best action</p>
          <h3 className="mt-3 text-xl font-semibold text-white">{nextBest?.title ?? "Set your next study target"}</h3>
          <p className="mt-2 text-sm text-slate-300">{nextBest?.why ?? "Add more evidence through a practice or battle session to generate the next action."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/battle" className="rounded-full bg-violet-500 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-400">Start battle</Link>
            <Link href="/assessments" className="rounded-full border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-400">Practice</Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Placement signal</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-300">Readiness</span>
            <span className="text-sm font-semibold text-cyan-200">{commandCenter.placement_readiness?.state ?? "BUILDING"}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-300">Confidence</span>
            <span className="text-sm font-semibold text-cyan-200">{commandCenter.placement_readiness?.confidence ?? "LOW"}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-300">Roadmap</span>
            <span className="text-sm font-semibold text-white">{commandCenter.roadmap?.progress ?? 0}%</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {actionList.slice(0, 3).map((action) => (
          <div key={`${action.type}-${action.title}`} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-200">{action.type}</span>
              <span className="text-xs text-slate-400">{action.time}</span>
            </div>
            <h4 className="mt-3 text-base font-semibold text-white">{action.title}</h4>
            <p className="mt-2 text-sm text-slate-300">{action.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Priority gaps</p>
          <div className="mt-3 space-y-3">
            {gaps.length === 0 ? (
              <p className="text-sm text-slate-400">No active skill gap signals yet.</p>
            ) : (
              gaps.slice(0, 3).map((gap) => (
                <div key={gap.skill_id ?? gap.skill_name} className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-white">{gap.skill_name}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-amber-300">{gap.priority}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">{gap.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Study plan</p>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <div className="flex justify-between"><span>Study time</span><span>{commandCenter.study_hours?.minutes ?? 0} min</span></div>
            <div className="flex justify-between"><span>XP</span><span>{commandCenter.student_state?.xp ?? 0}</span></div>
            <div className="flex justify-between"><span>Streak</span><span>{commandCenter.student_state?.streak ?? 0} days</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
