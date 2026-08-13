"use client";

import { useEffect, useState } from "react";
import { leaderboardService, type LeaderboardEntry } from "@/services/leaderboard.service";

export default function LeaderboardPanel() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<{ rank: number | null; total_users: number; xp: number; level: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [leaderboardData, myRankData] = await Promise.all([
          leaderboardService.getLeaderboard(),
          leaderboardService.getMyRank(),
        ]);

        if (active) {
          setEntries(leaderboardData.leaderboard);
          setMyRank(myRankData);
        }
      } catch (err: any) {
        if (active) setError(err?.response?.data?.detail || "Unable to load leaderboard.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl shadow-violet-950/20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Rankings</p>
          <h2 className="text-2xl font-semibold">Global leaderboard</h2>
        </div>
        {myRank && (
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
            <div>Your rank</div>
            <div className="text-xl font-semibold">#{myRank.rank ?? "—"}</div>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-slate-400">Loading rankings...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-[0.5fr_2fr_1fr_1fr] bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-300">
            <span>#</span>
            <span>Player</span>
            <span>XP</span>
            <span>Rating</span>
          </div>
          {entries.map((entry) => (
            <div key={entry.user_id} className="grid grid-cols-[0.5fr_2fr_1fr_1fr] border-t border-white/10 bg-slate-950/50 px-4 py-3 text-sm">
              <span className="font-semibold text-violet-300">{entry.rank}</span>
              <div>
                <div className="font-medium">{entry.full_name || entry.username}</div>
                <div className="text-slate-400">@{entry.username}</div>
              </div>
              <span>{entry.xp}</span>
              <span>{entry.rating}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
