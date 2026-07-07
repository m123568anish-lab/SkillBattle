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
            : "border-white/10 bg-white/5 hover:border-cyan-500/40"
        }
      `}
    >
      {selected && (
        <Check
          size={20}
          className="absolute right-4 top-4 text-cyan-400"
        />
      )}

      <h3 className="text-lg font-semibold text-white">
        {language}
      </h3>
    </motion.button>
  );
}