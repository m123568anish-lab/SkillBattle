"use client";

import { motion } from "framer-motion";
import {
  Sword,
  Trophy,
  ArrowRight,
} from "lucide-react";

import GradientButton from "@/components/ui/gradient-button";

export default function BattleArenaCard() {
  return (
    <motion.div
      whileHover={{
        y: -5,
        scale: 1.01,
      }}
      className="
        rounded-3xl
        border
        border-red-500/20
        bg-gradient-to-br
        from-red-500/10
        via-slate-900
        to-orange-500/10
        p-8
      "
    >
      <div className="flex items-center gap-4">

        <div className="rounded-2xl bg-red-500/20 p-4">

          <Sword
            size={34}
            className="text-red-400"
          />

        </div>

        <div>

          <h2 className="text-2xl font-black text-white">
            Battle Arena
          </h2>

          <p className="text-slate-400">
            Challenge other developers.
          </p>

        </div>

      </div>

      <div className="mt-8 rounded-2xl bg-white/5 p-6">

        <div className="flex items-center gap-3">

          <Trophy
            className="text-yellow-400"
            size={22}
          />

          <span className="font-semibold text-white">
            Today's Tournament
          </span>

        </div>

        <p className="mt-4 leading-7 text-slate-400">
          Join today's coding battle,
          solve problems against real
          players and earn bonus XP.
        </p>

      </div>

      <div className="mt-8">

        <GradientButton>

          Enter Battle

          <ArrowRight
            size={18}
            className="ml-2"
          />

        </GradientButton>

      </div>

    </motion.div>
  );
}