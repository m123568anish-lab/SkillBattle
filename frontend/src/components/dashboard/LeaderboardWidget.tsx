"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { leaderboardService, type LeaderboardEntry } from "@/services/leaderboard.service";
import { formatDashboardNumber } from "@/lib/dashboard-data.mjs";

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
      className="rounded-[28px] border border-[#252525] bg-[#101010] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)] sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3 border-b border-[#252525] pb-5">
        <Crown className="text-[#F0BC58]" size={24} />
        <h2 className="text-2xl font-black text-[#F5F5F5]">
          Top Leaderboard
        </h2>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[#F08A7A]">{error}</p>
      ) : loading ? (
        <p role="status" className="text-sm text-[#A1A1AA]">Loading leaderboard...</p>
      ) : leaderboard.length === 0 ? (
        <p className="text-sm text-[#A1A1AA]">No leaderboard entries recorded yet.</p>
      ) : (
        <ol className="space-y-2" aria-label="Top leaderboard">
          {leaderboard.slice(0, 10).map((user, index) => (
            <li
              key={user.user_id || index}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#252525] bg-[#0B0B0B] px-4 py-3 transition-colors hover:border-[#D8FF3E]/20"
            >
              <div className="flex items-center gap-4">
                <span className="w-8 text-center font-bold tabular-nums text-[#D8FF3E]">
                  #{index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#F5F5F5]">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-xs text-[#A1A1AA]">
                    Level {user.level}
                  </p>
                </div>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-[#D8FF3E]">
                {formatDashboardNumber(user.xp)} XP
              </span>
            </li>
          ))}
        </ol>
      )}
    </motion.div>
  );
}