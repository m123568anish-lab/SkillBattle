"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import api from "@/services/api";
import { Flame, Calendar, CheckCircle2, Zap, Target } from "lucide-react";

// Generate a 12-week heatmap grid (84 days)
function generateHeatmapDays(activityMap: Record<string, number>) {
  const days: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({ date: key, count: activityMap[key] ?? 0 });
  }
  return days;
}

function heatColor(count: number) {
  if (count === 0) return "bg-slate-800/60";
  if (count === 1) return "bg-violet-500/30";
  if (count === 2) return "bg-violet-500/60";
  if (count >= 3) return "bg-violet-500";
  return "bg-violet-600";
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function CalendarPage() {
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Simulate some activity data
  const today = new Date().toISOString().split("T")[0];
  const activityMap: Record<string, number> = {};
  for (let i = 0; i < 84; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    activityMap[key] = Math.random() > 0.45 ? Math.floor(Math.random() * 4) + 1 : 0;
  }
  const heatmapDays = generateHeatmapDays(activityMap);

  // Group into weeks
  const weeks: typeof heatmapDays[] = [];
  for (let i = 0; i < heatmapDays.length; i += 7) {
    weeks.push(heatmapDays.slice(i, i + 7));
  }

  useEffect(() => {
    api.get("/streak")
      .then((r) => setStreak(r.data))
      .catch(() => setStreak({ current_streak: 0, best_streak: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const totalActive = heatmapDays.filter((d) => d.count > 0).length;
  const totalSessions = heatmapDays.reduce((a, b) => a + b.count, 0);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
          📅 Activity Calendar
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Your 12-week coding activity heatmap, daily streaks, and consistency metrics.
        </p>
      </div>

      {/* Streak & Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Current Streak", value: `${streak?.current_streak ?? 0} 🔥`, icon: Flame, color: "from-orange-500 to-red-500" },
          { label: "Best Streak",    value: `${streak?.best_streak ?? 0} days`, icon: Target,  color: "from-yellow-500 to-amber-500" },
          { label: "Active Days",    value: totalActive,                          icon: Calendar, color: "from-cyan-500 to-blue-500" },
          { label: "Total Sessions", value: totalSessions,                        icon: Zap,    color: "from-violet-500 to-indigo-500" },
        ].map((card, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 flex items-center gap-4">
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">{card.label}</p>
              <p className="text-xl font-black text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-8 backdrop-blur-xl">
        <h3 className="mb-6 text-lg font-bold text-white flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-400" /> 12-Week Activity Heatmap
        </h3>

        {/* Month labels */}
        <div className="mb-2 ml-10 grid gap-0.5" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
          {weeks.map((week, wi) => {
            const firstDay = new Date(week[0].date);
            return (
              <div key={wi} className="text-[10px] text-slate-500 truncate">
                {firstDay.getDate() <= 7 ? MONTHS[firstDay.getMonth()] : ""}
              </div>
            );
          })}
        </div>

        <div className="flex gap-1.5">
          {/* Day of week labels */}
          <div className="flex flex-col gap-0.5 justify-around pr-1.5">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className="text-[10px] text-slate-500 h-4 flex items-center">{i % 2 === 0 ? d : ""}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5 flex-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5 flex-1">
                {week.map((day, di) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} session${day.count !== 1 ? "s" : ""}`}
                    className={`h-4 rounded-sm transition-all cursor-default ${heatColor(day.count)} ${
                      day.date === today ? "ring-2 ring-violet-400 ring-offset-1 ring-offset-slate-900" : ""
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500">
          <span>Less</span>
          {["bg-slate-800/60", "bg-violet-500/30", "bg-violet-500/60", "bg-violet-500", "bg-violet-600"].map((c, i) => (
            <div key={i} className={`h-3.5 w-3.5 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="mt-8 rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl">
        <h3 className="mb-4 text-lg font-bold text-white">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { label: "Completed Daily Challenge", time: "Today, 09:14 AM", xp: "+50 XP", icon: "🎯" },
            { label: "Won Multiplayer Battle vs AlgoKing", time: "Yesterday, 11:30 PM", xp: "+120 XP", icon: "⚔️" },
            { label: "Solved 'Maximum Subarray' (Hard)", time: "2 days ago", xp: "+100 XP", icon: "💻" },
            { label: "Completed Week 1 Roadmap Tasks", time: "3 days ago", xp: "+75 XP", icon: "🗺️" },
            { label: "Mock Interview: Google SWE", time: "4 days ago", xp: "+150 XP", icon: "🎙️" },
          ].map((act, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-800/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{act.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{act.label}</p>
                  <p className="text-xs text-slate-500">{act.time}</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                {act.xp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
