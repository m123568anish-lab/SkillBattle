"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import api from "@/services/api";
import { Trophy, Medal, Flame, Crown, ChevronUp, ChevronDown, Minus } from "lucide-react";

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-300" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-black text-slate-500 w-5 text-center">{rank}</span>;
}

function getRankBadge(rank: number) {
  if (rank === 1) return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
  if (rank === 2) return "bg-slate-400/10 border-slate-400/30 text-slate-300";
  if (rank === 3) return "bg-amber-600/10 border-amber-600/30 text-amber-500";
  return "bg-white/5 border-white/5 text-slate-300";
}

export default function LeaderboardPage() {
  const [board, setBoard] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"xp" | "battles">("xp");

  useEffect(() => {
    Promise.all([
      api.get("/leaderboard").catch(() => ({ data: [] })),
      api.get("/leaderboard/me").catch(() => ({ data: null })),
    ]).then(([lb, me]) => {
      setBoard(Array.isArray(lb.data) ? lb.data : lb.data?.entries ?? []);
      setMyRank(me.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-500 tracking-tight">
            🏆 Global Leaderboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track rankings, compare XP, and battle your way to the top.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/50 p-1">
          {(["xp", "battles"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                filter === f
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {f === "xp" ? "⚡ XP Rank" : "⚔️ Battles"}
            </button>
          ))}
        </div>
      </div>

      {/* My Rank Card */}
      {myRank && (
        <div className="mb-6 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/20 text-xl font-black text-violet-300">
              #{myRank.rank ?? "—"}
            </div>
            <div>
              <p className="text-xs font-bold text-violet-400 uppercase tracking-wider">Your Current Standing</p>
              <p className="font-extrabold text-white">{myRank.username}</p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-black text-white">{(myRank.xp ?? 0).toLocaleString()}</p>
              <p className="text-xs text-slate-400">Total XP</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">{myRank.level ?? 1}</p>
              <p className="text-xs text-slate-400">Level</p>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {!loading && board.length >= 3 && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[board[1], board[0], board[2]].map((player, podiumIdx) => {
            const actualRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
            const heights = ["h-24", "h-32", "h-20"];
            const glows = ["shadow-slate-400/20", "shadow-yellow-400/30", "shadow-amber-600/20"];
            return (
              <div key={player?.id ?? podiumIdx} className="flex flex-col items-center gap-2">
                <div className="text-2xl">{actualRank === 1 ? "👑" : actualRank === 2 ? "🥈" : "🥉"}</div>
                <div className={`w-full rounded-2xl border ${getRankBadge(actualRank)} flex flex-col items-center justify-end p-4 ${heights[podiumIdx]} shadow-lg ${glows[podiumIdx]}`}>
                  <p className="font-extrabold text-sm text-white text-center">{player?.username ?? "—"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{(player?.xp ?? 0).toLocaleString()} XP</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Rankings Table */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 border-b border-white/5 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          <span className="col-span-1">Rank</span>
          <span className="col-span-5">Player</span>
          <span className="col-span-2 text-right">Level</span>
          <span className="col-span-2 text-right">XP</span>
          <span className="col-span-2 text-right">Streak</span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          </div>
        ) : board.length === 0 ? (
          <p className="py-12 text-center text-slate-400">No leaderboard data available yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {board.map((player: any, idx: number) => (
              <div
                key={player.id ?? player.username ?? idx}
                className={`grid grid-cols-12 gap-4 px-6 py-4 transition hover:bg-white/5 ${
                  myRank?.id === player.id ? "bg-violet-500/5" : ""
                }`}
              >
                <div className="col-span-1 flex items-center">{getRankIcon(idx + 1)}</div>

                <div className="col-span-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-black text-white flex-shrink-0">
                    {player.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{player.username}</p>
                    <p className="text-xs text-slate-500">{player.email ?? ""}</p>
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-end">
                  <span className="rounded-lg bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-300">
                    Lv. {player.level ?? 1}
                  </span>
                </div>

                <div className="col-span-2 flex items-center justify-end font-black text-white">
                  {(player.xp ?? 0).toLocaleString()}
                </div>

                <div className="col-span-2 flex items-center justify-end gap-1 text-sm font-bold text-orange-400">
                  <Flame className="h-4 w-4" />
                  {player.current_streak ?? 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
