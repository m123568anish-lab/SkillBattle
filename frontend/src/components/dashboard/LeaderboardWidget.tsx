"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { leaderboardService, type LeaderboardEntry } from "@/services/leaderboard.service";

export default function LeaderboardWidget() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await leaderboardService.getLeaderboard();
        if (active) {
          setLeaderboard(res.leaderboard || []);
        }
      } catch (err) {
        if (active) setError("Unable to load leaderboard.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-8"
    >
      <div className="mb-8 flex items-center gap-3">
        <Crown className="text-yellow-400" size={28} />
        <h2 className="text-2xl font-black text-white">
          Top Leaderboard
        </h2>
      </div>

      {error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : loading ? (
        <p className="text-sm text-slate-400">Loading leaderboard...</p>
      ) : leaderboard.length === 0 ? (
        <p className="text-sm text-slate-400">No leaderboard entries recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {leaderboard.slice(0, 10).map((user, index) => (
            <div
              key={user.user_id || index}
              className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-4">
                <span className="w-8 text-center font-bold text-cyan-400">
                  #{index + 1}
                </span>
                <div>
                  <p className="font-semibold text-white">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-xs text-slate-400">
                    Level {user.level}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-cyan-400">
                {user.xp.toLocaleString()} XP
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}