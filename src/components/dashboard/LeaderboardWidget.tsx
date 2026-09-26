"use client";

import { motion } from "framer-motion";
import { Crown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { leaderboardService, type LeaderboardEntry } from "@/services/leaderboard.service";

export default function LeaderboardWidget() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    leaderboardService
      .getLeaderboard()
      .then((res) => {
        if (isMounted) {
          setLeaderboard(res.leaderboard.slice(0, 10));
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.detail || "Failed to load leaderboard");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <motion.div
      whileHover={{
        y: -5,
      }}
      className="
        rounded-3xl
        border
        border-white/10
        bg-white/5
        p-8
      "
    >
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="text-yellow-400" size={28} />
          <h2 className="text-2xl font-black text-white">Top 10 Leaderboard</h2>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400">
          {error}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
          No leaderboard data available yet.
        </div>
      ) : (
        <div className="space-y-4">
          {leaderboard.map((user, index) => (
            <div
              key={user.user_id || index}
              className="
                flex
                items-center
                justify-between
                rounded-xl
                bg-white/5
                px-4
                py-3
              "
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