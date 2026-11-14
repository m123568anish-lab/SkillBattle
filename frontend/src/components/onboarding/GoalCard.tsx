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
      type="button"
      aria-pressed={selected}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative rounded-lg border p-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] motion-reduce:transition-none ${
        selected
          ? "border-[var(--accent)]/60 bg-[var(--accent)]/[0.08]"
          : "border-[var(--border-default)] bg-[var(--surface-elevated)] hover:border-[var(--border-focus)] hover:bg-[var(--surface-hover)]"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--text-on-accent)]">
          <Check size={12} strokeWidth={3} />
        </span>
      )}

      {recommended && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-2 py-1 text-[10px] font-semibold text-[var(--text-secondary)]">
          <Star size={12} className="text-[var(--accent-strong)]" />
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
