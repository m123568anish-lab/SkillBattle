"use client";

import { Crown } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  rank: number;
  name: string;
  xp: string;
  level: number;
}

export default function LeaderboardCard({
  rank,
  name,
  xp,
  level,
}: Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 font-bold text-white">
          {rank}
        </div>

        <div>
          <h3 className="font-semibold text-white">
            {name}
          </h3>

          <p className="text-sm text-slate-400">
            Level {level}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Crown className="text-yellow-400" />

        <span className="font-bold text-cyan-400">
          {xp} XP
        </span>
      </div>
    </motion.div>
  );
}