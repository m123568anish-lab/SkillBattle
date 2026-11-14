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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative rounded-2xl border p-5 text-left transition-all duration-200 ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent)]/15 shadow-[0_0_16px_rgba(216,255,62,0.15)] ring-1 ring-[var(--accent)]"
          : "border-[var(--border-default)] bg-[var(--surface-elevated)] hover:border-[var(--border-focus)]/50 hover:bg-[var(--surface-subtle)]"
      }`}
    >
      {selected && (
        <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--text-on-accent)]">
          <Check size={12} strokeWidth={3} />
        </span>
      )}

      <Building2
        className={`mb-4 transition-colors ${selected ? "text-[var(--accent-strong)]" : "text-[var(--text-muted)]"}`}
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
