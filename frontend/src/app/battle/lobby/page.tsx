"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import API_ENDPOINTS from "@/lib/api-constants";

type LobbyState = { queue_size: number; modes: Record<string, number>; status?: string; position?: number; matched?: boolean; room_id?: string };

export default function BattleLobbyPage() {
  const [state, setState] = useState<LobbyState>({ queue_size: 0, modes: {} });
  const [mode, setMode] = useState("ranked");
  const [busy, setBusy] = useState(false);
  const userId = useMemo(() => {
    if (typeof window === "undefined") return "anonymous";
    return localStorage.getItem("user_id") || localStorage.getItem("username") || "anonymous";
  }, []);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const socket = new WebSocket(`${base.replace(/^http/, "ws")}/matchmaking/ws/${encodeURIComponent(userId)}`);
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.event === "lobby_snapshot" || message.event === "queue_updated" || message.event === "match_found") setState(message);
    };
    return () => socket.close();
  }, [userId]);

  async function join() {
    setBusy(true);
    try { setState(await api.post(API_ENDPOINTS.MATCHMAKING.QUEUE_JOIN, { mode }).then((response) => response.data)); }
    finally { setBusy(false); }
  }

  async function leave() {
    setState(await api.post(API_ENDPOINTS.MATCHMAKING.QUEUE_LEAVE).then((response) => response.data));
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm uppercase tracking-[.3em] text-cyan-300">Live arena</p>
        <h1 className="mt-3 text-4xl font-bold">1v1 matchmaking lobby</h1>
        <p className="mt-3 text-slate-400">Find a similarly rated opponent and prepare before the battle starts.</p>
        <section className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between"><span className="text-slate-300">Players searching</span><strong className="text-2xl">{state.queue_size}</strong></div>
          <div className="mt-6 flex flex-wrap gap-3">
            <select value={mode} onChange={(event) => setMode(event.target.value)} className="rounded-xl bg-slate-800 px-4 py-3">
              <option value="ranked">Ranked placement</option><option value="casual">Casual 1v1</option>
            </select>
            <button disabled={busy} onClick={join} className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">{busy ? "Searching…" : "Find opponent"}</button>
            <button onClick={leave} className="rounded-xl border border-white/10 px-5 py-3">Leave queue</button>
          </div>
          {state.status === "waiting" && <p className="mt-5 text-cyan-300">Searching — position {state.position || 1}</p>}
          {state.matched && <Link href={`/battle/placement-prep?room=${state.room_id || ""}`} className="mt-5 block rounded-xl bg-emerald-400 px-4 py-3 text-center font-semibold text-slate-950">Opponent found · Continue to Placement Prep</Link>}
        </section>
      </div>
    </main>
  );
}
