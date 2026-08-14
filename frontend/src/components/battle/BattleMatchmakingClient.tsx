"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { battleService } from "@/services/battle.service";
import { friendService, type FriendResponse } from "@/services/friend.service";

type QueueMode = "global" | "friend";

type QueueStatus = {
  matched: boolean;
  queue_size: number;
  battle_id?: string;
};

export default function BattleMatchmakingClient() {
  const router = useRouter();
  const [status, setStatus] = useState("idle");
  const [battleId, setBattleId] = useState<string | null>(null);
  const [queueSize, setQueueSize] = useState(0);
  const [mode, setMode] = useState<QueueMode>("global");
  const [difficulty, setDifficulty] = useState("Medium");
  const [language, setLanguage] = useState("python");
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const resp = await friendService.listFriends();
        if (active) {
          setFriends(resp.friends);
          if (resp.friends.length > 0) {
            setSelectedFriendId(resp.friends[0].user_id);
          }
        }
      } finally {
        if (active) setLoadingFriends(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (status === "waiting") {
      interval = setInterval(async () => {
        try {
          const resp = await battleService.queueStatus();
          setQueueSize(resp.queue_size ?? 0);
          if (resp.matched && resp.battle_id) {
            setBattleId(resp.battle_id);
            setStatus("matched");
            if (interval) clearInterval(interval);
            router.push(`/battle/${resp.battle_id}`);
          }
        } catch (err) {
          console.error(err);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, router]);

  async function handleJoinQueue() {
    setStatus("joining");

    if (mode === "friend" && !selectedFriendId) {
      toast.error("Select a friend to start a private match.");
      setStatus("idle");
      return;
    }

    try {
      const payload = {
        mode,
        difficulty,
        language,
        ranked: false,
        friend_id: mode === "friend" ? selectedFriendId : undefined,
      };
      const resp = await battleService.joinQueue(payload);
      setStatus(resp.matched ? "matched" : "waiting");
      setQueueSize(resp.queue_size ?? 0);
      if (resp.battle_id) {
        setBattleId(resp.battle_id);
        if (resp.matched) router.push(`/battle/${resp.battle_id}`);
      }
      toast.success(mode === "global" ? "Joined global matchmaking queue" : "Invited friend to a queued match");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Unable to join queue");
      setStatus("idle");
    }
  }

  async function leaveQueue() {
    try {
      await battleService.leaveQueue();
      setStatus("idle");
      setBattleId(null);
      setQueueSize(0);
      toast("Left queue");
    } catch (err) {
      console.error(err);
      toast.error("Error leaving queue");
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-white shadow-2xl shadow-violet-950/20">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Matchmaking deck</p>
          <h2 className="text-2xl font-semibold">Choose your battle flow</h2>
        </div>
        <div className="rounded-2xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
          Queue size: <span className="font-semibold text-white">{queueSize}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4 rounded-3xl bg-slate-900/80 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-400">Battle type</span>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-slate-400">Preferred skill</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none">
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
              </select>
            </label>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-sm text-slate-300">Match mode</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["global", "friend"] as QueueMode[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMode(option)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === option ? "bg-violet-500 text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
                >
                  {option === "global" ? "Global match" : "Friend invite"}
                </button>
              ))}
            </div>
          </div>

          {mode === "friend" && (
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Invite a friend</p>
                  <p className="text-xs text-slate-500">Your friend must be in your friend list.</p>
                </div>
              </div>
              <div className="mt-4">
                {loadingFriends ? (
                  <p className="text-slate-400">Loading friends...</p>
                ) : friends.length === 0 ? (
                  <p className="text-slate-400">No friends found. Add friends to unlock private matches.</p>
                ) : (
                  <select value={selectedFriendId} onChange={(e) => setSelectedFriendId(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none">
                    {friends.map((friend) => (
                      <option key={friend.user_id} value={friend.user_id} className="bg-slate-950 text-white">
                        {friend.user_id}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={handleJoinQueue} className="rounded-3xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:opacity-90">
              {mode === "friend" ? "Join friend queue" : "Join global queue"}
            </button>
            <button onClick={leaveQueue} className="rounded-3xl border border-white/10 bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800">
              Leave queue
            </button>
          </div>
        </div>

        <aside className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <div className="rounded-3xl bg-white/5 p-4">
            <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Queue status</p>
            <p className="mt-2 text-xl font-semibold text-white">{status === "idle" ? "Idle" : status === "joining" ? "Enqueuing" : status === "waiting" ? "Waiting for match" : "Matched"}</p>
          </div>
          <div className="rounded-3xl bg-slate-950/80 p-4">
            <p className="text-sm text-slate-400">Live queue insight</p>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <div>Mode: <span className="font-semibold text-white">{mode === "friend" ? "Friend match" : "Global matchmaking"}</span></div>
              <div>Skill: <span className="font-semibold text-white">{language}</span></div>
              <div>Battle difficulty: <span className="font-semibold text-white">{difficulty}</span></div>
              <div>Queued players: <span className="font-semibold text-white">{queueSize}</span></div>
            </div>
          </div>
          {battleId ? (
            <div className="rounded-3xl bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Matched battle</p>
              <a href={`/battle/${battleId}`} className="mt-2 block rounded-full bg-violet-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90">
                Enter battle room
              </a>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
