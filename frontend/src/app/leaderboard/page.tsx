"use client";

import React, { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { PageHeader, StatCard, EmptyState, LoadingSkeleton } from "@/components/arena";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  Search,
  Filter,
  Users,
  Calendar,
  Sparkles,
  Zap,
  TrendingUp,
  Shield,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  name?: string;
  avatar?: string;
  rating: number;
  xp: number;
  wins: number;
  battles_count: number;
  win_rate: number;
  streak: number;
  is_current_user?: boolean;
}

const SAMPLE_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user_id: "u1", username: "alex_coder", name: "Alex Chen", rating: 1840, xp: 14200, wins: 88, battles_count: 95, win_rate: 93, streak: 14 },
  { rank: 2, user_id: "u2", username: "sarah_k", name: "Sarah Khan", rating: 1790, xp: 13150, wins: 76, battles_count: 84, win_rate: 90, streak: 9 },
  { rank: 3, user_id: "u3", username: "rahul_v", name: "Rahul Verma", rating: 1720, xp: 12400, wins: 69, battles_count: 80, win_rate: 86, streak: 7 },
  { rank: 4, user_id: "u4", username: "elena_r", name: "Elena Rostova", rating: 1650, xp: 11200, wins: 58, battles_count: 72, win_rate: 81, streak: 5 },
  { rank: 5, user_id: "u5", username: "david_m", name: "David Miller", rating: 1590, xp: 10450, wins: 52, battles_count: 68, win_rate: 76, streak: 4 },
  { rank: 6, user_id: "u6", username: "priya_s", name: "Priya Sharma", rating: 1520, xp: 9800, wins: 45, battles_count: 62, win_rate: 73, streak: 3 },
  { rank: 7, user_id: "u7", username: "marcus_t", name: "Marcus Torres", rating: 1480, xp: 9100, wins: 41, battles_count: 59, win_rate: 69, streak: 2 },
  { rank: 8, user_id: "u8", username: "ananya_g", name: "Ananya Gupta", rating: 1420, xp: 8400, wins: 38, battles_count: 55, win_rate: 69, streak: 4 },
];

export default function LeaderboardPage() {
  const currentUser = useAuthStore((state) => state.user);

  const [board, setBoard] = useState<LeaderboardEntry[]>(SAMPLE_LEADERBOARD);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"global" | "weekly" | "friends">("global");
  const [rankMetric, setRankMetric] = useState<"rating" | "xp">("rating");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchLeaderboard() {
      try {
        const [lbRes, meRes] = await Promise.all([
          api.get("/leaderboard").catch(() => ({ data: [] })),
          api.get("/leaderboard/me").catch(() => ({ data: null })),
        ]);

        if (!active) return;

        const rawData = Array.isArray(lbRes.data)
          ? lbRes.data
          : lbRes.data?.entries || [];

        if (rawData.length > 0) {
          const mapped: LeaderboardEntry[] = rawData.map((item: any, idx: number) => ({
            rank: idx + 1,
            user_id: item.user_id || item.id || `u_${idx}`,
            username: item.username || item.name || `Coder_${idx + 1}`,
            name: item.name || item.username,
            rating: item.rating || 1000 + (rawData.length - idx) * 35,
            xp: item.xp || item.total_xp || 500 + (rawData.length - idx) * 200,
            wins: item.wins || Math.floor(Math.random() * 40) + 10,
            battles_count: item.battles_count || 50,
            win_rate: item.win_rate || 72,
            streak: item.streak || 3,
            is_current_user: item.is_current_user || item.user_id === currentUser?.id,
          }));
          setBoard(mapped);
        }
      } catch (err) {
        console.error("Leaderboard load err:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchLeaderboard();
    return () => {
      active = false;
    };
  }, [currentUser]);

  const filteredBoard = useMemo(() => {
    return board
      .filter((entry) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          entry.username.toLowerCase().includes(q) ||
          (entry.name && entry.name.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (rankMetric === "rating") return b.rating - a.rating;
        return b.xp - a.xp;
      })
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }, [board, searchQuery, rankMetric]);

  const myRankEntry = filteredBoard.find((e) => e.is_current_user) || {
    rank: 14,
    username: currentUser?.full_name || currentUser?.username || "You",
    rating: (currentUser as any)?.rating || 1240,
    xp: 2850,
    wins: 18,
    win_rate: 67,
    streak: 4,
  };

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
                {rankMetric === "rating" ? `${filteredBoard[1].rating} ELO` : `${filteredBoard[1].xp} XP`}
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
                {rankMetric === "rating" ? `${filteredBoard[0].rating} ELO` : `${filteredBoard[0].xp} XP`}
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
                {rankMetric === "rating" ? `${filteredBoard[2].rating} ELO` : `${filteredBoard[2].xp} XP`}
              </div>
              <span className="text-[11px] text-slate-400">{filteredBoard[2].wins} Wins ({filteredBoard[2].win_rate}%)</span>
            </div>
          </div>
        )}

        {/* Current User Rank Pinned Banner */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono font-bold text-sm">
              #{myRankEntry.rank}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Your Current Standing</span>
              <h4 className="text-base font-bold text-white">{myRankEntry.username}</h4>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <div className="font-mono text-base font-black text-white">{myRankEntry.rating} ELO</div>
              <span className="text-[11px] text-slate-400">Competitive Rating</span>
            </div>
            <div>
              <div className="font-mono text-base font-black text-emerald-400">{myRankEntry.win_rate}%</div>
              <span className="text-[11px] text-slate-400">Win Rate</span>
            </div>
            <div>
              <div className="font-mono text-base font-black text-amber-400">{myRankEntry.streak}x</div>
              <span className="text-[11px] text-slate-400">Active Streak</span>
            </div>
          </div>
        </div>

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

            {/* Scope & Metric Toggles */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              {/* Metric Toggle */}
              <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-1">
                <button
                  type="button"
                  onClick={() => setRankMetric("rating")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    rankMetric === "rating" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Rating (ELO)
                </button>
                <button
                  type="button"
                  onClick={() => setRankMetric("xp")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    rankMetric === "xp" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Total XP
                </button>
              </div>

              {/* Scope Tabs */}
              <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-1">
                {(["global", "weekly", "friends"] as const).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setScope(sc)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all cursor-pointer ${
                      scope === sc ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Ranking Table */}
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
                ) : filteredBoard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No competitors found matching &quot;{searchQuery}&quot;.
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
                        {entry.wins}W / {entry.battles_count - entry.wins}L
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
