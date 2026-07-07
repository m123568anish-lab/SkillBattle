"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";

import { leaderboard } from "@/data/leaderboard";

export default function LeaderboardWidget() {
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
      <div className="mb-8 flex items-center gap-3">

        <Crown
          className="text-yellow-400"
          size={28}
        />

        <h2 className="text-2xl font-black text-white">
          Top 10 Leaderboard
        </h2>

      </div>

      <div className="space-y-4">

        {leaderboard.map((user, index) => (

          <div
            key={user.id}
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
                  {user.name}
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

    </motion.div>
  );
}