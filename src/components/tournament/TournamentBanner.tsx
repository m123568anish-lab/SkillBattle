"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Users, Clock3, Swords, ArrowRight, Zap } from "lucide-react";
import { tournament } from "@/data/tournament";

export default function TournamentBanner() {
  const router = useRouter();

  return (
    <section className="relative py-24 lg:py-32">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 flex justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-fuchsia-600/10 blur-[150px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#1c1236]/80 to-black/60 backdrop-blur-2xl shadow-[0_0_80px_rgba(192,38,211,0.15)]"
        >
          {/* Animated Glow Spot */}
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/30 blur-[100px] mix-blend-screen" />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="border-b border-white/10 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-600 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                      Weekly Tournament
                    </span>
                    <span className="flex items-center gap-1 rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                      <Zap className="h-3 w-3" /> LIVE NOW
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {tournament.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Content Stats */}
            <div className="grid gap-4 p-8 sm:p-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group rounded-3xl border border-white/5 bg-white/5 p-6 transition-colors hover:bg-white/10 hover:border-yellow-500/30">
                <Trophy className="mb-4 h-7 w-7 text-yellow-400 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Prize Pool</p>
                <h3 className="text-2xl font-black text-white">{tournament.prizePool}</h3>
              </div>

              <div className="group rounded-3xl border border-white/5 bg-white/5 p-6 transition-colors hover:bg-white/10 hover:border-cyan-500/30">
                <Clock3 className="mb-4 h-7 w-7 text-cyan-400 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Registration Ends</p>
                <h3 className="text-2xl font-black text-white">{tournament.duration}</h3>
              </div>

              <div className="group rounded-3xl border border-white/5 bg-white/5 p-6 transition-colors hover:bg-white/10 hover:border-emerald-500/30">
                <Users className="mb-4 h-7 w-7 text-emerald-400 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Registered Players</p>
                <h3 className="text-2xl font-black text-white">{tournament.players.toLocaleString()}</h3>
              </div>

              <div className="group rounded-3xl border border-white/5 bg-white/5 p-6 transition-colors hover:bg-white/10 hover:border-pink-500/30">
                <Swords className="mb-4 h-7 w-7 text-pink-400 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Battle Mode</p>
                <h3 className="text-2xl font-black text-white">{tournament.mode}</h3>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col items-start justify-between gap-6 border-t border-white/10 p-8 sm:p-10 lg:flex-row lg:items-center bg-black/20">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Entry: <span className="text-emerald-400">{tournament.entry}</span>
                </h3>
                <p className="text-sm font-medium text-slate-400">
                  Compete against elite players, prove your skills, and win massive XP and exclusive rewards.
                </p>
              </div>
              <button
                onClick={() => router.push("/tournament")}
                className="group flex w-full lg:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-fuchsia-600/20 transition-all duration-300 hover:scale-105 hover:shadow-violet-500/40"
              >
                Join Tournament Now
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}