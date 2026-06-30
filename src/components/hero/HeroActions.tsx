"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.3,
        duration: 0.6,
      }}
      className="mt-10 flex flex-wrap gap-4"
    >
      {/* Primary Button */}
      <Button
        size="lg"
        className="
          group
          h-14
          rounded-xl
          bg-gradient-to-r
          from-violet-600
          to-cyan-500
          px-8
          text-base
          font-semibold
          text-white
          shadow-lg
          shadow-violet-600/30
          transition-all
          duration-300
          hover:scale-105
          hover:shadow-cyan-500/40
        "
      >
        Start Battle

        <ArrowRight
          className="
            ml-2
            h-5
            w-5
            transition-transform
            duration-300
            group-hover:translate-x-1
          "
        />
      </Button>

      {/* Secondary Button */}
      <Button
        variant="outline"
        size="lg"
        className="
          h-14
          rounded-xl
          border-white/20
          bg-white/5
          px-8
          text-base
          backdrop-blur-xl
          transition-all
          duration-300
          hover:bg-white/10
          hover:border-cyan-400
        "
      >
        <Play className="mr-2 h-5 w-5" />

        Watch Demo
      </Button>
    </motion.div>
  );
}