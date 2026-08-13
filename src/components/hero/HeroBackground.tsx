"use client";

import { motion } from "framer-motion";

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-[#070B14]">

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Purple Orb */}
      <motion.div
        animate={{
          x: [0, 80, 0],
          y: [0, -60, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[160px]"
      />

      {/* Cyan Orb */}
      <motion.div
        animate={{
          x: [0, -100, 0],
          y: [0, 80, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 right-0 h-[550px] w-[550px] rounded-full bg-cyan-500/20 blur-[180px]"
      />

      {/* Pink Center Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
        className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-[180px]"
      />

      {/* Small Floating Lights */}

      <motion.div
        animate={{
          y: [-30, 30, -30],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
        className="absolute left-[15%] top-[25%] h-4 w-4 rounded-full bg-cyan-400 shadow-[0_0_30px_10px_rgba(34,211,238,.6)]"
      />

      <motion.div
        animate={{
          y: [30, -20, 30],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
        }}
        className="absolute right-[20%] top-[35%] h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_25px_10px_rgba(139,92,246,.7)]"
      />

      <motion.div
        animate={{
          y: [-20, 40, -20],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
        }}
        className="absolute bottom-[18%] left-[35%] h-4 w-4 rounded-full bg-pink-500 shadow-[0_0_25px_12px_rgba(236,72,153,.6)]"
      />
    </div>
  );
}