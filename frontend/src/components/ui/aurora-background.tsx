"use client";

import { motion } from "framer-motion";

export default function AuroraBackground() {
  return (
    <>
      <motion.div
        animate={{
          x: [-100, 100, -100],
          y: [-50, 80, -50],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-cyan-500/15 blur-[170px]"
      />

      <motion.div
        animate={{
          x: [80, -100, 80],
          y: [60, -80, 60],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute right-0 bottom-0 h-[650px] w-[650px] rounded-full bg-violet-600/15 blur-[190px]"
      />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
        }}
        className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/10 blur-[180px]"
      />
    </>
  );
}