"use client";

import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";

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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative rounded-2xl border p-6 text-left transition-all duration-200 ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent)]/15 shadow-[0_0_16px_rgba(216,255,62,0.15)] ring-1 ring-[var(--accent)]"
          : "border-[var(--border-default)] bg-[var(--surface-elevated)] hover:border-[var(--border-focus)]/50 hover:bg-[var(--surface-subtle)]"
      }`}
    >
      {selected && (
        <span className="absolute right-5 top-5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--text-on-accent)]">
          <Check size={12} strokeWidth={3} />
        </span>
      )}

      {recommended && (
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
          <Star size={13} className="fill-current" />
          <span>Recommended</span>
        </div>
      )}

      <h3 className="text-lg font-bold text-[var(--text-primary)]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
        {description}
      </p>
    </motion.button>
  );
}
