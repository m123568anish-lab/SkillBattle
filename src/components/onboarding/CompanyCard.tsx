"use client";

import { motion } from "framer-motion";
import { Building2, CheckCircle2 } from "lucide-react";

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
      whileHover={{
        scale: 1.04,
      }}
      whileTap={{
        scale: 0.97,
      }}
      onClick={onClick}
      className={`
        relative
        rounded-2xl
        border
        p-5
        text-left
        transition-all
        duration-300

        ${
          selected
            ? "border-cyan-400 bg-cyan-500/20"
            : "border-white/10 bg-white/5 hover:border-cyan-500/30"
        }
      `}
    >
      {selected && (
        <CheckCircle2
          className="absolute right-4 top-4 text-cyan-400"
          size={20}
        />
      )}

      <Building2
        className="mb-5 text-cyan-400"
        size={28}
      />

      <h3 className="text-lg font-semibold text-white">
        {company}
      </h3>

      <span
        className={`
          mt-3
          inline-flex
          rounded-full
          px-3
          py-1
          text-xs
          font-semibold

          ${
            type === "Product"
              ? "bg-green-500/20 text-green-300"
              : "bg-orange-500/20 text-orange-300"
          }
        `}
      >
        {type}
      </span>
    </motion.button>
  );
}