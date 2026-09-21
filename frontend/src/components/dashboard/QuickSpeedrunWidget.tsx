"use client";

import Link from "next/link";
import { Trophy, ArrowRight, Target, ShieldCheck } from "lucide-react";

export default function QuickSpeedrunWidget() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-slate-900/60 to-slate-950 p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-400">
            <Trophy className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Placement Prep</span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Live Assessment</span>
            </div>
            <h3 className="mt-1 text-lg font-bold text-white">
              Company OA Speedrun & Placement Index
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Practice Amazon, Google, TCS, and Infosys simulated Online Assessments with Core CS MCQs + Coding.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/battle/company-speedrun"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition active:scale-95"
          >
            Start Speedrun
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/placement/scorecard"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            Scorecard
          </Link>
        </div>
      </div>
    </div>
  );
}
