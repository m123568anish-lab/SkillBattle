"use client";

import { motion, useReducedMotion } from "framer-motion";

interface Props {
  currentXP: number;
  nextLevelXP: number;
}

export default function XPProgress({ currentXP, nextLevelXP }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const percentage = Math.min((currentXP / (nextLevelXP || 1)) * 100, 100);

  const radius = 38;
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-default)] p-5 shadow-xl transition-[border-color,box-shadow] duration-200 hover:border-[var(--accent)]/30">
      <div className="relative flex items-center justify-center h-24 w-24">
        {/* Subtle Lime Aura for Ring */}
        <div
          aria-hidden="true"
          className="absolute inset-2 rounded-full opacity-15 blur-md"
          style={{ background: "var(--accent)" }}
        />

        <svg className="h-24 w-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-[var(--border-default)] fill-none stroke-[6px]"
          />
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-[var(--accent)] fill-none stroke-[6px] stroke-linecap-round"
            initial={shouldReduceMotion ? false : { strokeDashoffset: strokeDasharray }}
            animate={{ strokeDashoffset }}
            transition={{ duration: shouldReduceMotion ? 0 : 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ strokeDasharray }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-lg font-black text-[var(--text-primary)] font-mono">
            {Math.round(percentage)}%
          </span>
          <span className="text-[10px] text-[var(--accent-strong)] font-bold uppercase tracking-widest">
            XP
          </span>
        </div>
      </div>
      <div className="text-center sm:text-left">
        <h4 className="font-bold text-[var(--text-primary)] text-base">Progress to Next Level</h4>
        <p className="text-sm text-[var(--text-secondary)] mt-1 font-mono">
          <span className="text-[var(--accent-strong)] font-bold">{currentXP.toLocaleString()} XP</span> / {nextLevelXP.toLocaleString()} XP
        </p>
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-2.5 py-0.5 text-xs text-[var(--accent-strong)] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]" />
          Level Up Quest Active
        </div>
      </div>
    </div>
  );
}
