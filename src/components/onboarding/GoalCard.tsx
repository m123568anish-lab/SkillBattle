"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Star } from "lucide-react";

interface Props {
  title: string;
  description: string;
  recommended: boolean;
  selected: boolean;
  onClick: () => void;
}

export default function GoalCard({
  title,
  description,
  recommended,
  selected,
  onClick,
}: Props) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative
        rounded-2xl
        border
        p-6
        text-left
        transition-all

        ${
          selected
            ? "border-cyan-400 bg-cyan-500/20"
            : "border-white/10 bg-white/5 hover:border-cyan-500/30"
        }
      `}
    >
      {selected && (
        <CheckCircle2
          size={22}
          className="absolute right-5 top-5 text-cyan-400"
        />
      )}

      {recommended && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-3 py-1 text-xs text-yellow-300">
          <Star size={14} />
          Recommended
        </div>
      )}

      <h3 className="text-xl font-bold text-white">
        {title}
      </h3>

      <p className="mt-3 text-slate-400">
        {description}
      </p>
    </motion.button>
  );
}