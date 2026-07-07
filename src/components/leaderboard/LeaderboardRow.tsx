"use client";

import { motion } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  Flame,
  Trophy,
} from "lucide-react";

import type { LeaderboardUser } from "@/data/leaderboard";

interface Props {
  player: LeaderboardUser;
}

export default function LeaderboardRow({ player }: Props) {
  const rank = Number(1);
  const change = "same" as string;
  const online = true;
  const country = "India";
  const streak = 12;

  const getRankColor = () => {
    switch (rank) {
      case 1:
        return "from-yellow-400 to-amber-500";
      case 2:
        return "from-gray-300 to-gray-500";
      case 3:
        return "from-orange-400 to-orange-600";
      default:
        return "from-violet-500 to-cyan-500";
    }
  };

  const RankIcon = () => {
    switch (change) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-400" />;
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <motion.div
      whileHover={{
        scale: 1.01,
        x: 8,
      }}
      transition={{ duration: 0.2 }}
      className="
        flex
        items-center
        justify-between
        rounded-2xl
        border
        border-white/10
        bg-white/5
        p-5
        backdrop-blur-xl
        transition-all
        duration-300
        hover:border-cyan-400/30
      "
    >
      {/* Left */}

      <div className="flex items-center gap-5">

        {/* Rank */}

        <div
          className={`
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            bg-gradient-to-br
            ${getRankColor()}
            text-lg
            font-bold
            text-white
          `}
        >
          {rank}
        </div>

        {/* Avatar */}

        <div className="relative">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-xl font-bold text-white">
            {player.name.charAt(0)}
          </div>

          {online && (
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#070B14] bg-green-400" />
          )}

        </div>

        {/* Name */}

        <div>

          <div className="flex items-center gap-2">

            <h3 className="font-bold text-white">
              {player.name}
            </h3>

            <span>{country}</span>

          </div>

          <div className="mt-1 flex items-center gap-2">

            <RankIcon />

            <span className="text-sm text-slate-400">
              Rank Movement
            </span>

          </div>

        </div>

      </div>

      {/* Right */}

      <div className="flex items-center gap-8">

        <div className="text-center">

          <div className="flex items-center gap-2">

            <Flame className="text-orange-400" size={18} />

            <span className="font-semibold text-white">
              {streak}
            </span>

          </div>

          <p className="text-xs text-slate-400">
            Streak
          </p>

        </div>

        <div className="text-center">

          <div className="flex items-center gap-2">

            <Trophy className="text-yellow-400" size={18} />

            <span className="font-semibold text-white">
              {player.xp.toLocaleString()}
            </span>

          </div>

          <p className="text-xs text-slate-400">
            XP
          </p>

        </div>

      </div>

    </motion.div>
  );
}