"use client";

import { motion } from "framer-motion";
import {
  Users,
  Clock3,
  Star,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BattleMode } from "@/data/battleModes";

interface BattleModeCardProps {
  mode: BattleMode;
}

export default function BattleModeCard({
  mode,
}: BattleModeCardProps) {
  const Icon = mode.icon;

  return (
    <motion.div
      whileHover={{
        y: -10,
        scale: 1.02,
      }}
      transition={{
        duration: 0.25,
      }}
      className="
        group
        relative
        overflow-hidden
        rounded-3xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-2xl
        p-6
        shadow-xl
        transition-all
        duration-300
        hover:border-cyan-400/40
      "
    >
      {/* Glow */}

      <div
        className={`
          absolute
          -top-24
          right-0
          h-44
          w-44
          rounded-full
          bg-gradient-to-r
          ${mode.gradient}
          opacity-20
          blur-3xl
        `}
      />

      {/* Icon */}

      <div
        className={`
          relative
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-2xl
          bg-gradient-to-br
          ${mode.gradient}
          shadow-lg
        `}
      >
        <Icon className="h-8 w-8 text-white" />
      </div>

      {/* Title */}

      <h3 className="relative mt-6 text-2xl font-bold text-white">
        {mode.title}
      </h3>

      {/* Description */}

      <p className="relative mt-3 leading-7 text-slate-400">
        {mode.description}
      </p>

      {/* Info */}

      <div className="relative mt-6 space-y-3">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2 text-slate-300">
            <Users size={18} />

            {mode.players.toLocaleString()} Online
          </div>

          <span
            className="
              rounded-full
              border
              border-cyan-400/20
              bg-cyan-500/10
              px-3
              py-1
              text-xs
              text-cyan-300
            "
          >
            {mode.difficulty}
          </span>

        </div>

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2 text-slate-300">
            <Clock3 size={18} />

            {mode.duration}
          </div>

          <div className="flex items-center gap-2 text-yellow-400">
            <Star size={18} />

            +{mode.xp} XP
          </div>

        </div>

      </div>

      {/* Button */}

      <Button
        className="
          mt-8
          w-full
          rounded-xl
          bg-gradient-to-r
          from-violet-600
          to-cyan-500
          transition-all
          duration-300
          group-hover:scale-[1.02]
        "
      >
        Play Now

        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </motion.div>
  );
}