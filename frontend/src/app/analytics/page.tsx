"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import api from "@/services/api";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line,
} from "recharts";
import { BarChart3, Flame, Swords, Target, TrendingUp, Award } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/overview")
      .then((r) => setData(r.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
          📊 Performance Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Deep-dive into your algorithmic skill breakdown, battle history, and XP progression trends.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        </div>
      ) : !data ? (
        <p className="text-slate-400">Failed to load analytics.</p>
      ) : (
        <div className="space-y-8">
          {/* Top KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Battle Win Rate", value: `${data.win_rate}%`, icon: Swords, color: "from-rose-500 to-orange-500" },
              { label: "Total Battles", value: data.total_battles, icon: Flame, color: "from-amber-400 to-yellow-600" },
              { label: "Current Level", value: data.level, icon: Award, color: "from-violet-500 to-indigo-500" },
              { label: "Avg Solve Time", value: `${Math.round(data.avg_solve_time_sec / 60)}m`, icon: Target, color: "from-cyan-500 to-blue-600" },
            ].map((kpi, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 flex items-center gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.color} shadow-lg`}>
                  <kpi.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">{kpi.label}</p>
                  <p className="text-2xl font-black text-white">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Skill Radar */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-bold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-400" /> Skill Breakdown Radar
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={data.skill_breakdown}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Radar name="You" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Activity Bar Chart */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" /> Monthly Battle Activity
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthly_activity}>
                    <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                      itemStyle={{ color: "#fff", fontWeight: "bold" }}
                    />
                    <Bar dataKey="battles" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Battles" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* XP Progression Line Chart */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" /> XP Progression Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthly_activity}>
                  <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    itemStyle={{ color: "#fff", fontWeight: "bold" }}
                  />
                  <Line type="monotone" dataKey="xp" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 5 }} name="XP Earned" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
