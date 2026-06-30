"use client";

import { motion } from "framer-motion";

interface SpotlightProps {
  className?: string;
}

export default function Spotlight({
  className = "",
}: SpotlightProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.8,
      }}
      animate={{
        opacity: [0.25, 0.4, 0.25],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`
        pointer-events-none
        absolute
        left-1/2
        top-1/2
        -translate-x-1/2
        -translate-y-1/2
        h-[650px]
        w-[650px]
        rounded-full
        bg-gradient-to-r
        from-cyan-500/20
        via-violet-500/20
        to-pink-500/20
        blur-[140px]
        ${className}
      `}
    />
  );
}