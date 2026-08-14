"use client";

import { Users, Sword, Trophy, Server, Activity, ArrowUpRight, ArrowDownRight, Database } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

// Simulated Data
const trafficData = [
  { time: "00:00", users: 120 },
  { time: "04:00", users: 80 },
  { time: "08:00", users: 450 },
  { time: "12:00", users: 890 },
  { time: "16:00", users: 1050 },
  { time: "20:00", users: 780 },
  { time: "24:00", users: 300 },
];

export default function AdminOverview() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = [
    {
      title: "Total Registered Users",
      value: "14,209",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Active Battles",
      value: "342",
      change: "+5.2%",
      trend: "up",
      icon: Sword,
      color: "from-rose-500 to-orange-500",
    },
    {
      title: "Challenges Solved (24h)",
      value: "8,941",
      change: "-2.1%",
      trend: "down",
      icon: Trophy,
      color: "from-amber-400 to-yellow-600",
    },
    {
      title: "System Uptime",
      value: "99.99%",
      change: "Stable",
      trend: "up",
      icon: Server,
      color: "from-emerald-400 to-teal-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-3xl transition-opacity group-hover:opacity-40" />
            
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
                  stat.trend === "up" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.change}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-400">{stat.title}</h3>
              <p className="mt-1 text-3xl font-black text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts & Server Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Activity Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Platform Traffic (24h)</h3>
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
              <Activity className="h-4 w-4 text-violet-400" />
              Live Sync
            </div>
          </div>
          
          <div className="h-72 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    itemStyle={{ color: "#fff", fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Server & Node Status */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <h3 className="text-lg font-bold text-white mb-6">Infrastructure</h3>
          
          <div className="space-y-6">
            {/* API Server */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-300">API Gateway</span>
                <span className="text-emerald-400 font-bold">Healthy</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-[45%] bg-emerald-500 rounded-full" />
              </div>
              <p className="mt-1 text-xs text-slate-500">45% Load (802 req/s)</p>
            </div>

            {/* Database */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-300">Primary Database</span>
                <span className="text-emerald-400 font-bold">Healthy</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-[60%] bg-emerald-500 rounded-full" />
              </div>
              <p className="mt-1 text-xs text-slate-500">60% CPU (Replication Active)</p>
            </div>

            {/* Redis Cache */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-300">Redis Cache</span>
                <span className="text-amber-400 font-bold">Warning</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-[85%] bg-amber-500 rounded-full" />
              </div>
              <p className="mt-1 text-xs text-slate-500">85% Memory (Eviction soon)</p>
            </div>
            
            {/* Code Execution Engine */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-300">Execution Sandbox</span>
                <span className="text-emerald-400 font-bold">Healthy</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-[30%] bg-violet-500 rounded-full" />
              </div>
              <p className="mt-1 text-xs text-slate-500">30% Capacity (12 instances)</p>
            </div>
          </div>
          
          <button className="mt-8 w-full rounded-xl bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition">
            View Detailed Metrics
          </button>
        </div>
      </div>
    </div>
  );
}
