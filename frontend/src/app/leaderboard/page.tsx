"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { PageHeader } from "@/components/arena";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Trophy,
  Medal,
  Crown,
  Search,
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  name?: string;
  avatar?: string | null;
  rating: number;
  xp: number;
  solved: number;
  wins: number;
  losses: number;
  draws: number;
  battles_count: number;
  win_rate: number;
  streak: number;
  is_current_user: boolean;
}

interface MyRankResponse {
  rank: number | null;
  total_users: number;
  xp: number;
  level: number;
}

interface LeaderboardResponse {
  leaderboard: Omit<LeaderboardEntry, "is_current_user">[];
}

export default function LeaderboardPage() {
  const currentUser = useAuthStore((state) => state.user);

  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRankResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leaderboardResponse, rankResponse] = await Promise.all([
        api.get<LeaderboardResponse>("/leaderboard"),
        api.get<MyRankResponse>("/leaderboard/me"),
      ]);
      const entries = leaderboardResponse.data.leaderboard.map((item, index) => ({
        ...item,
        rank: index + 1,
        is_current_user: item.user_id === currentUser?.id,
      }));
      setBoard(entries);
      setMyRank(rankResponse.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the leaderboard.");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  const filteredBoard = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return board.filter((entry) =>
      entry.username.toLowerCase().includes(query)
      || (entry.name?.toLowerCase().includes(query) ?? false),
    );
  }, [board, searchQuery]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-amber-400 fill-amber-400/20" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-300" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-xs font-mono font-bold text-slate-400 w-5 text-center">{rank}</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Qubira Rankings"
          subtitle="Real-time ratings, competitive records, and verified achievements of Qubira engineers."
          theme="battle"
          breadcrumbs={[
            { label: "Qubira Arena", href: "/battle" },
            { label: "Rankings", href: "/leaderboard", current: true },
          ]}
        />

        {/* Top 3 Podium Highlights */}
        {filteredBoard.length >= 3 && !searchQuery && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Rank 2 */}
            <div className="order-2 md:order-1 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 text-center space-y-2 backdrop-blur-sm">
              <div className="flex justify-center">
                <Medal className="h-7 w-7 text-slate-300" />
              </div>
              <div className="h-12 w-12 rounded-full border-2 border-slate-400 bg-slate-800 flex items-center justify-center font-bold text-slate-200 mx-auto">
                2
              </div>
              <h4 className="font-bold text-white text-sm truncate">{filteredBoard[1].name}</h4>
              <div className="font-mono text-sm font-extrabold text-slate-300">
                {filteredBoard[1].xp.toLocaleString()} XP
              </div>
              <span className="text-[11px] text-slate-400">{filteredBoard[1].wins} Wins ({filteredBoard[1].win_rate}%)</span>
            </div>

            {/* Rank 1 (Crown Champion) */}
            <div className="order-1 md:order-2 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-slate-900/80 p-6 text-center space-y-2 backdrop-blur-md shadow-2xl scale-[1.02]">
              <div className="flex justify-center">
                <Crown className="h-8 w-8 text-amber-400 fill-amber-400/30 animate-pulse" />
              </div>
              <div className="h-14 w-14 rounded-full border-2 border-amber-400 bg-amber-500/20 flex items-center justify-center font-black text-amber-300 text-lg mx-auto shadow-lg shadow-amber-500/20">
                1
              </div>
              <h4 className="font-black text-white text-base truncate">{filteredBoard[0].name}</h4>
              <div className="font-mono text-base font-black text-amber-400">
                {filteredBoard[0].xp.toLocaleString()} XP
              </div>
              <span className="text-xs font-semibold text-amber-300/80">
                {filteredBoard[0].wins} Wins • {filteredBoard[0].streak}x Streak
              </span>
            </div>

            {/* Rank 3 */}
            <div className="order-3 rounded-2xl border border-amber-700/50 bg-slate-900/60 p-5 text-center space-y-2 backdrop-blur-sm">
              <div className="flex justify-center">
                <Medal className="h-7 w-7 text-amber-600" />
              </div>
              <div className="h-12 w-12 rounded-full border-2 border-amber-600 bg-slate-800 flex items-center justify-center font-bold text-amber-500 mx-auto">
                3
              </div>
              <h4 className="font-bold text-white text-sm truncate">{filteredBoard[2].name}</h4>
              <div className="font-mono text-sm font-extrabold text-amber-500">
                {filteredBoard[2].xp.toLocaleString()} XP
              </div>
              <span className="text-[11px] text-slate-400">{filteredBoard[2].wins} Wins ({filteredBoard[2].win_rate}%)</span>
            </div>
          </div>
        )}

        {/* Current User Rank Pinned Banner */}
        {myRank?.rank !== null && myRank && (
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono font-bold text-sm">
                #{myRank.rank}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Your Current Standing</span>
                <h4 className="text-base font-bold text-white">
                  {currentUser?.full_name || currentUser?.username || "Your account"}
                </h4>
                <span className="text-xs text-slate-400">Among {myRank.total_users.toLocaleString()} eligible students</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div>
                <div className="font-mono text-base font-black text-white">{myRank.xp.toLocaleString()} XP</div>
                <span className="text-[11px] text-slate-400">Persisted XP</span>
              </div>
              <div>
                <div className="font-mono text-base font-black text-emerald-400">{myRank.level}</div>
                <span className="text-[11px] text-slate-400">Level</span>
              </div>
            </div>
          </div>
        )}

        {/* Search & Scope Filters Bar */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search competitors by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

          </div>
        </div>

        {/* Main Ranking Table */}
        {error && (
          <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-rose-200">
            <p>{error}</p>
            <button type="button" onClick={() => void loadLeaderboard()} className="mt-3 rounded-lg bg-white/10 px-4 py-2 font-semibold hover:bg-white/15">
              Retry
            </button>
          </div>
        )}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Rating (ELO)</th>
                  <th className="py-3.5 px-4">Total XP</th>
                  <th className="py-3.5 px-4">Record (W/L)</th>
                  <th className="py-3.5 px-4 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Loading latest ladder rankings...
                    </td>
                  </tr>
                ) : error ? (
                  <tr><td colSpan={6} className="p-8 text-center text-rose-300">Leaderboard data is unavailable.</td></tr>
                ) : filteredBoard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      {searchQuery ? `No students found matching "${searchQuery}".` : "No eligible student records are available yet."}
                    </td>
                  </tr>
                ) : (
                  filteredBoard.map((entry) => (
                    <tr
                      key={entry.user_id}
                      className={`hover:bg-white/[0.03] transition-colors ${
                        entry.is_current_user ? "bg-purple-950/20 font-bold" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center">{getRankBadge(entry.rank)}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center font-bold text-white text-xs">
                            {entry.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white block">
                              {entry.name || entry.username}
                              {entry.is_current_user && (
                                <span className="ml-2 text-[10px] text-purple-300 font-normal border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 rounded">
                                  You
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-500">@{entry.username}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-black text-purple-300">
                        {entry.rating}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {entry.xp.toLocaleString()} XP
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {entry.wins}W / {entry.losses}L
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-emerald-400">{entry.win_rate}%</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
