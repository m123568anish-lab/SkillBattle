"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus, Flame, Trophy } from "lucide-react";
import type { LeaderboardUser } from "@/data/leaderboard";

interface Props {
  player: LeaderboardUser;
  index: number;
}

export default function LeaderboardRow({ player, index }: Props) {
  const rank = index + 1;
  const change = index % 3 === 0 ? "up" : index % 4 === 0 ? "down" : "same";
  const online = index < 3 || index % 2 === 0;
  const country = "Global";
  const streak = 15 - index; // simulated streak

  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return "from-yellow-400 to-amber-600 shadow-[0_0_20px_rgba(250,204,21,0.4)] border-yellow-400/50";
      case 2:
        return "from-slate-300 to-slate-500 shadow-[0_0_20px_rgba(148,163,184,0.4)] border-slate-300/50";
      case 3:
        return "from-orange-400 to-orange-700 shadow-[0_0_20px_rgba(251,146,60,0.4)] border-orange-400/50";
      default:
        return "from-[#0f172a] to-[#1e293b] border-white/10 shadow-inner";
    }
  };

  const RankIcon = () => {
    switch (change) {
      case "up":
        return <ArrowUp className="h-3.5 w-3.5 text-green-400" />;
      case "down":
        return <ArrowDown className="h-3.5 w-3.5 text-red-400" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 5 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border bg-white/5 p-4 sm:p-5 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 ${rank <= 3 ? "border-white/10" : "border-transparent hover:border-cyan-500/30"}`}
    >
      {/* Left Area: Rank, Avatar, Name */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        {/* Rank Badge */}
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br ${getRankStyle()} text-lg font-black text-white`}>
          {rank <= 3 ? <Trophy className="h-5 w-5 absolute opacity-20" /> : null}
          <span className="relative z-10">{rank}</span>
        </div>

        {/* Avatar Area */}
        <div className="relative shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-lg font-bold text-white shadow-lg">
            {player.name.charAt(0)}
          </div>
          {online && (
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#070B14] bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
          )}
        </div>

        {/* Player Details */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-base md:text-lg">{player.name}</h3>
            {rank <= 3 && <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-yellow-400">Pro</span>}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-300 uppercase tracking-widest text-[9px]">LVL {player.level}</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="uppercase tracking-widest text-[9px]">{country}</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <div className="flex items-center gap-0.5">
              <RankIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Right Area: Stats */}
      <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
        <div className="flex flex-col items-center sm:items-end">
          <div className="flex items-center gap-1.5">
            <Flame className="text-orange-400 h-4 w-4" />
            <span className="font-black text-white">{streak}</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Streak</p>
        </div>

        <div className="flex flex-col items-center sm:items-end">
          <div className="flex items-center gap-1.5">
            <Trophy className="text-yellow-400 h-4 w-4" />
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">
              {player.xp.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Total XP</p>
        </div>
      </div>
    </motion.div>
  );
}