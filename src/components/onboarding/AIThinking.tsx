"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export default function AIThinking() {
  return (
    <div className="flex justify-center">

      <motion.div
        animate={{
          rotate: [0, 5, -5, 5, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        className="
          flex
          h-32
          w-32
          items-center
          justify-center
          rounded-full
          border
          border-cyan-500/40
          bg-cyan-500/10
          shadow-[0_0_60px_rgba(0,255,255,.25)]
        "
      >
        <Bot
          size={70}
          className="text-cyan-400"
        />
      </motion.div>

    </div>
  );
}