"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Users, Clock, Zap, Flame, Shield } from "lucide-react";
import type { BattleRecord } from "@/services/battle.service";

interface WaitingBattleCardProps {
  battle: BattleRecord;
  index: number;
  onJoin: (battleId: string) => void;
  isJoining?: boolean;
}

// Difficulty color and icon mapping
const getDifficultyStyle = (difficulty?: string) => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return {
        color: "from-emerald-400 to-teal-500",
        bgLight: "bg-emerald-500/10",
        text: "text-emerald-300",
        border: "border-emerald-500/30",
        icon: "🟢",
      };
    case "medium":
      return {
        color: "from-amber-400 to-orange-500",
        bgLight: "bg-amber-500/10",
        text: "text-amber-300",
        border: "border-amber-500/30",
        icon: "🟡",
      };
    case "hard":
      return {
        color: "from-rose-400 to-red-500",
        bgLight: "bg-rose-500/10",
        text: "text-rose-300",
        border: "border-rose-500/30",
        icon: "🔴",
      };
    default:
      return {
        color: "from-slate-400 to-slate-500",
        bgLight: "bg-slate-500/10",
        text: "text-slate-300",
        border: "border-slate-500/30",
        icon: "⚪",
      };
  }
};

const WaitingBattleCard = memo(
  function WaitingBattleCard({
    battle,
    index,
    onJoin,
    isJoining,
  }: WaitingBattleCardProps) {
    const difficulty = battle.difficulty || "Unknown";
    const style = getDifficultyStyle(difficulty);
    const createdTime = battle.created_at
      ? new Date(battle.created_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      : "--:--:--";

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        whileHover={{ y: -4 }}
        className={`group relative rounded-[1.5rem] border overflow-hidden backdrop-blur-sm transition-all duration-300 ${style.border} ${style.bgLight} bg-gradient-to-br from-[#0D1226]/90 to-slate-950/60 shadow-lg shadow-black/20 hover:shadow-[0_0_30px_rgba(0,0,0,0.4)]`}
      >
        {/* Animated Gradient Border */}
        <div
          className={`absolute inset-0 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-[1px] bg-gradient-to-r ${style.color} pointer-events-none`}
          style={{
            mask: "linear-gradient(to right, black, black 97%, transparent)",
          }}
        />

        {/* Glow Effect */}
        <div
          className={`absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-gradient-to-r ${style.color}`}
        />

        <div className="relative z-10 p-5 sm:p-6 space-y-4">
          {/* Header Section */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-black text-white truncate">
                {battle.title || "Untitled Battle"}
              </h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${style.bgLight} ${style.text} border ${style.border}`}>
                  {style.icon}
                  <span className="uppercase">{difficulty}</span>
                </div>
                {battle.problem_id && (
                  <div className="text-xs font-semibold text-slate-400">
                    Problem #{battle.problem_id}
                  </div>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(6,182,212,0.4)",
                  "0 0 0 12px rgba(6,182,212,0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 whitespace-nowrap`}
            >
              ⚡ {battle.status || "Waiting"}
            </motion.div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs">
              <div className={`flex-shrink-0 p-2 rounded-lg ${style.bgLight}`}>
                <Users size={14} className={style.text} />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-semibold uppercase">Players</p>
                <p className="text-white font-bold">
                  {battle.max_players || "?"} max
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className={`flex-shrink-0 p-2 rounded-lg ${style.bgLight}`}>
                <Clock size={14} className={style.text} />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-semibold uppercase">Created</p>
                <p className="text-white font-bold text-[11px]">
                  {createdTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs col-span-2 sm:col-span-1">
              <div className={`flex-shrink-0 p-2 rounded-lg ${style.bgLight}`}>
                <Zap size={14} className={style.text} />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-semibold uppercase">Reward</p>
                <p className="text-white font-bold">+XP</p>
              </div>
            </div>
          </div>

          {/* Join Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onJoin(battle.id)}
            disabled={isJoining}
            className={`w-full mt-4 py-3 px-4 rounded-xl font-bold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden group/btn disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {/* Button background gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${style.color} opacity-100 group-hover/btn:opacity-90 transition-opacity`}
            />

            {/* Button content */}
            <div className="relative z-10 flex items-center justify-center gap-2">
              <Flame size={16} className="group-hover/btn:animate-pulse" />
              <span>{isJoining ? "Joining..." : "Enter Battle"}</span>
            </div>
          </motion.button>
        </div>
      </motion.div>
    );
  }
);

WaitingBattleCard.displayName = "WaitingBattleCard";

export default WaitingBattleCard;
