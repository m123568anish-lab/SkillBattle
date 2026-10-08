import React from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BattleMatchmakingClient from "@/components/battle/BattleMatchmakingClient";

export default function QueuePage() {
  return (
    <RequireAuth>
      <DashboardLayout>
        <div className="space-y-6 py-2">
          <header className="overflow-hidden rounded-[28px] border border-violet-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.20),_transparent_25%),linear-gradient(135deg,#0a1020,#121b2e_35%,#090d18)] p-6 shadow-[0_25px_60px_rgba(76,29,149,0.18)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-violet-200">Matchmaking queue</p>
                <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">Find your next fight</h1>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-cyan-200">Live queue</span>
                <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-violet-200">Ranked</span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-200">Private</span>
              </div>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Solo challenge", description: "Warm up in the practice arena and sharpen your coding rhythm.", accent: "from-cyan-500/10 to-sky-500/10" },
              { title: "Live queue", description: "Jump into ranked matches and test your speed under pressure.", accent: "from-violet-500/10 to-indigo-500/10" },
              { title: "Private lobby", description: "Create a room and compete with friends or teammates.", accent: "from-emerald-500/10 to-teal-500/10" },
            ].map((card) => (
              <div key={card.title} className={`rounded-[24px] border border-white/10 bg-gradient-to-br ${card.accent} p-5`}>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-300">Arena mode</p>
                <h2 className="mt-3 text-xl font-black text-white">{card.title}</h2>
                <p className="mt-2 text-sm text-slate-300">{card.description}</p>
              </div>
            ))}
          </div>

          <BattleMatchmakingClient />
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}
