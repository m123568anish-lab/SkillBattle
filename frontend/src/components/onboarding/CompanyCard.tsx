"use client";

import { motion } from "framer-motion";
import { Building2, Check } from "lucide-react";

interface Props {
  company: string;
  type: string;
  selected: boolean;
  onClick: () => void;
}

export default function CompanyCard({
  company,
  type,
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

      <Building2
        className={`mb-3 transition-colors ${selected ? "text-[var(--accent-strong)]" : "text-[var(--text-muted)]"}`}
        size={24}
      />

      <h3 className="text-base font-bold text-[var(--text-primary)]">
        {company}
      </h3>

      <span className="mt-2 inline-block rounded-md border border-[var(--border-subtle)] bg-[var(--surface-card)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {type}
      </span>
    </motion.button>
  );
}
