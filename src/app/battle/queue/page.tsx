import React from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import BattleMatchmakingClient from "@/components/battle/BattleMatchmakingClient";

export default function QueuePage() {
  return (
    <RequireAuth>
      <div className="p-6">
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl shadow-violet-950/20">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Matchmaking queue</p>
          <h1 className="mt-2 text-4xl font-black">Find your next fight</h1>
          <p className="mt-3 max-w-2xl text-slate-400">Use the live queue to join a global match or team up with a friend for a private battle experience.</p>
        </div>

        <BattleMatchmakingClient />
      </div>
    </RequireAuth>
  );
}
