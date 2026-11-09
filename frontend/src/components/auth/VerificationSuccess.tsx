"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function VerificationSuccess() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--accent,#D8FF3E)]/30 bg-[var(--accent,#D8FF3E)]/15 text-[var(--accent-strong,#D8FF3E)] shadow-[0_0_30px_rgba(216,255,62,0.2)]"
      >
        <CheckCircle2 size={40} />
      </motion.div>

      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent,#D8FF3E)]/30 bg-[var(--accent,#D8FF3E)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong,#D8FF3E)]">
        <Sparkles size={11} />
        Verified
      </div>

      <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary,#F5F5F5)] sm:text-3xl">
        Email Verified Successfully
      </h2>

      <p className="mt-2.5 max-w-sm text-sm text-[var(--text-secondary,#999999)]">
        Your cryptographic identity has been confirmed. Redirecting you to your workspace command center...
      </p>
    </motion.div>
  );
}
