"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { battleService } from "@/services/battle.service";

export default function BattleQueueClient() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "joining" | "waiting" | "matched">("idle");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [queueSize, setQueueSize] = useState<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function joinQueue() {
    setStatus("joining");
    try {
      const resp = await battleService.joinQueue({ difficulty: "medium", language: "python", ranked: false });
      if (resp.status === "matched" && resp.battle_id) {
        setMatchId(resp.battle_id);
        setStatus("matched");
        toast.success("Match found! Entering battle…");
        router.push(`/battle/${resp.battle_id}`);
        return;
      }
      setStatus("waiting");
      setQueueSize(resp.queue_size ?? 0);
      toast.success("Joined matchmaking queue");
      startPolling();
    } catch (err) {
      console.error(err);
      setStatus("idle");
      toast.error("Failed to join queue. Please try again.");
    }
  }

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const resp = await battleService.queueStatus();
        setQueueSize(resp.queue_size ?? 0);
        if (resp.matched && resp.battle_id) {
          clearInterval(pollRef.current!);
          setMatchId(resp.battle_id);
          setStatus("matched");
          toast.success("Match found! Entering battle…");
          router.push(`/battle/${resp.battle_id}`);
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000);
  }

  async function leaveQueue() {
    if (pollRef.current) clearInterval(pollRef.current);
    try {
      await battleService.leaveQueue();
      setStatus("idle");
      setQueueSize(0);
      toast("Left matchmaking queue");
    } catch (e) {
      console.error(e);
      toast.error("Error leaving queue");
    }
  }

  const statusLabel = {
    idle: "Not in queue",
    joining: "Joining…",
    waiting: `Searching… (${queueSize} in queue)`,
    matched: "Match found!",
  }[status];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold">Matchmaking</h3>
        <p className="text-sm text-slate-400 mt-1">Join the global queue for a 1v1 coding battle.</p>
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          status === "waiting" ? "bg-yellow-400 animate-pulse" :
          status === "matched" ? "bg-emerald-400" :
          "bg-slate-600"
        }`} />
        <span className="text-sm">{statusLabel}</span>
      </div>

      {status === "idle" && (
        <button
          onClick={joinQueue}
          className="w-full rounded-full bg-violet-600 hover:bg-violet-500 px-4 py-3 text-sm font-semibold transition"
        >
          Find Match
        </button>
      )}

      {status === "joining" && (
        <button disabled className="w-full rounded-full bg-violet-600 opacity-50 px-4 py-3 text-sm font-semibold">
          Joining…
        </button>
      )}

      {status === "waiting" && (
        <button
          onClick={leaveQueue}
          className="w-full rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/10 px-4 py-3 text-sm font-semibold transition"
        >
          Cancel Search
        </button>
      )}

      {matchId && (
        <p className="text-sm text-emerald-400">Matched! Redirecting to battle…</p>
      )}
    </div>
  );
}
