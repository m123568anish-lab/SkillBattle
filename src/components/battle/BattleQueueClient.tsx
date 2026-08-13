"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function BattleQueueClient() {
  const [status, setStatus] = useState("idle");
  const [matchId, setMatchId] = useState<string | null>(null);

  async function joinQueue() {
    setStatus("joining");
    try {
      const resp = await api.post("/battle/queue/join", { difficulty: "medium", language: "python", ranked: false });
      setStatus("waiting");
      pollForMatch();
      toast.success("Joined queue");
    } catch (err) {
      console.error(err);
      setStatus("idle");
      toast.error("Failed to join queue");
    }
  }

  async function pollForMatch() {
    const int = setInterval(async () => {
      try {
        const resp = await api.get("/battle/queue/status");
        if (resp.data.matched) {
          setMatchId(resp.data.battle_id);
          setStatus("matched");
          clearInterval(int);
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000);
  }

  async function leaveQueue() {
    try {
      await api.post("/battle/queue/leave");
      setStatus("idle");
      toast("Left queue");
    } catch (e) {
      console.error(e);
      toast.error("Error leaving queue");
    }
  }

  return (
    <div className="p-4 rounded bg-gray-900">
      <h3 className="font-semibold mb-2">Matchmaking</h3>
      <div className="mb-2">Status: {status}</div>
      {!matchId ? (
        <div className="flex space-x-2">
          <button onClick={joinQueue} className="rounded bg-emerald-600 px-3 py-1">Join Queue</button>
          <button onClick={leaveQueue} className="rounded bg-red-600 px-3 py-1">Leave</button>
        </div>
      ) : (
        <div>Matched: <a className="text-blue-400" href={`/battle/${matchId}`}>{matchId}</a></div>
      )}
    </div>
  );
}
