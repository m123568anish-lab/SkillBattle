"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  language: string;
  selected: boolean;
  onClick: () => void;
}

export default function LanguageCard({
  language,
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

      <h3 className="text-base font-bold text-[var(--text-primary)]">
        {language}
      </h3>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Technical practice & challenges
      </p>
    </motion.button>
  );
}
