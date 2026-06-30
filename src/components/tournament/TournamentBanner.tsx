"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  Users,
  Clock3,
  Swords,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { tournament } from "@/data/tournament";

export default function TournamentBanner() {
  return (
    <section className="relative py-32">

      {/* Background Glow */}

      <div className="absolute inset-0 -z-10 flex justify-center">
        <div className="h-96 w-96 rounded-full bg-violet-600/20 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6">

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="
            overflow-hidden
            rounded-[32px]
            border
            border-white/10
            bg-white/5
            backdrop-blur-2xl
            shadow-2xl
          "
        >

          {/* Header */}

          <div className="border-b border-white/10 p-8">

            <div className="flex items-center gap-4">

              <div className="rounded-2xl bg-yellow-500/20 p-4">
                <Trophy className="h-8 w-8 text-yellow-400" />
              </div>

              <div>

                <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
                  Weekly Tournament
                </span>

                <h2 className="mt-2 text-4xl font-black text-white">
                  {tournament.title}
                </h2>

              </div>

            </div>

          </div>

          {/* Content */}

          <div className="grid gap-8 p-8 md:grid-cols-4">

            {/* Prize */}

            <div className="rounded-2xl bg-white/5 p-6">

              <Trophy className="mb-4 text-yellow-400" />

              <p className="text-sm text-slate-400">
                Prize Pool
              </p>

              <h3 className="mt-2 text-3xl font-bold text-white">
                {tournament.prizePool}
              </h3>

            </div>

            {/* Timer */}

            <div className="rounded-2xl bg-white/5 p-6">

              <Clock3 className="mb-4 text-cyan-400" />

              <p className="text-sm text-slate-400">
                Registration Ends
              </p>

              <h3 className="mt-2 text-3xl font-bold text-white">
                {tournament.duration}
              </h3>

            </div>

            {/* Players */}

            <div className="rounded-2xl bg-white/5 p-6">

              <Users className="mb-4 text-green-400" />

              <p className="text-sm text-slate-400">
                Registered Players
              </p>

              <h3 className="mt-2 text-3xl font-bold text-white">
                {tournament.players.toLocaleString()}
              </h3>

            </div>

            {/* Mode */}

            <div className="rounded-2xl bg-white/5 p-6">

              <Swords className="mb-4 text-pink-400" />

              <p className="text-sm text-slate-400">
                Battle Mode
              </p>

              <h3 className="mt-2 text-3xl font-bold text-white">
                {tournament.mode}
              </h3>

            </div>

          </div>

          {/* Footer */}

          <div className="flex flex-col items-center justify-between gap-6 border-t border-white/10 p-8 md:flex-row">

            <div>

              <h3 className="text-xl font-bold text-white">
                {tournament.entry}
              </h3>

              <p className="text-slate-400">
                Compete against the best players and win exciting rewards.
              </p>

            </div>

            <Button
              size="lg"
              className="
                rounded-xl
                bg-gradient-to-r
                from-violet-600
                to-cyan-500
                px-8
                shadow-lg
                transition-all
                duration-300
                hover:scale-105
              "
            >
              Join Tournament

              <ArrowRight className="ml-2 h-5 w-5" />

            </Button>

          </div>

        </motion.div>

      </div>

    </section>
  );
}