"use client";

import { motion } from "framer-motion";

interface Props {
  currentXP: number;
  nextLevelXP: number;
}

export default function XPProgress({
  currentXP,
  nextLevelXP,
}: Props) {
  const percentage = Math.min(
    (currentXP / nextLevelXP) * 100,
    100
  );

  return (
    <div className="mt-6">

      <div className="mb-2 flex justify-between">

        <span className="text-sm text-slate-400">
          XP Progress
        </span>

        <span className="text-sm font-semibold text-cyan-400">
          {currentXP} / {nextLevelXP}
        </span>

      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/10">

        <motion.div
          initial={{
            width: 0,
          }}
          animate={{
            width: `${percentage}%`,
          }}
          transition={{
            duration: 1.2,
          }}
          className="
            h-full
            rounded-full
            bg-gradient-to-r
            from-cyan-500
            via-sky-500
            to-violet-500
          "
        />

      </div>

    </div>
  );
}