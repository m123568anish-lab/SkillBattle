"use client";

import { motion } from "framer-motion";

interface BattleProgressProps {
  title: string;
  value: number;
  color?: string;
}

export default function BattleProgress({
  title,
  value,
  color = "from-cyan-500 to-violet-500",
}: BattleProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">
          {title}
        </span>

        <span className="text-sm font-semibold text-white">
          {value}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
          }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
    </div>
  );
}