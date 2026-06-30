"use client";

import { motion } from "framer-motion";

const particles = Array.from({ length: 25 });

export default function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((_, index) => (
        <motion.span
          key={index}
          className="absolute h-2 w-2 rounded-full bg-cyan-400/50"
          initial={{
            x: Math.random() * 1600,
            y: Math.random() * 900,
            opacity: 0.2,
            scale: 0.5,
          }}
          animate={{
            y: [null, -250],
            opacity: [0.2, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 8 + Math.random() * 8,
            repeat: Infinity,
            delay: Math.random() * 8,
          }}
        />
      ))}
    </div>
  );
}