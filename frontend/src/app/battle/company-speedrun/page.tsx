"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Building2, Clock, Trophy, Target, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

interface CompanyTrack {
  id: string;
  company_name: string;
  logo_symbol: string;
  tier: string;
  duration_minutes: number;
  mcq_count: number;
  coding_problem_count: number;
  tags: string[];
  description: string;
  recommended_min_rating: number;
}

export default function CompanySpeedrunPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState<CompanyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<CompanyTrack | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchTracks();
  }, []);

  async function fetchTracks() {
    try {
      const res = await api.get("/placement/company-tracks");
      setTracks(res.data || []);
    } catch (err) {
      toast.error("Failed to load company speedrun tracks");
    } finally {
      setLoading(false);
    }
  }

  async function startSpeedrun(track: CompanyTrack) {
    setStarting(true);
    try {
      const res = await api.post("/placement/hybrid-battle/start", {
        company_tag: track.company_name,
        difficulty: "medium",
      });
      const battleId = res.data?.battle_id;
      toast.success(`Starting ${track.company_name} Assessment Speedrun!`);
      router.push(`/battle/${battleId}?type=company_speedrun`);
    } catch (err) {
      toast.error("Could not start speedrun battle");
    } finally {
      setStarting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm font-semibold text-violet-300">
            <Trophy className="h-4 w-4 text-yellow-400" />
            Company Placement Assessment Arena
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Company-Specific Speedrun Battles
          </h1>
          <p className="mt-3 text-lg text-slate-400 max-w-2xl mx-auto">
            Simulate real 45–60 minute Online Assessment (OA) rounds from top recruiters with live timed MCQs and algorithmic coding challenges.
          </p>
        </div>

        {/* Tracks Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/10"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{track.logo_symbol}</span>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
                      {track.tier}
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-bold text-white group-hover:text-violet-300 transition">
                    {track.company_name} OA
                  </h3>
                  <p className="mt-2 text-sm text-slate-400 line-clamp-3">
                    {track.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {track.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-violet-400" />
                      {track.duration_minutes} Mins
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3.5 w-3.5 text-emerald-400" />
                      {track.mcq_count} MCQs + {track.coding_problem_count} Coding
                    </span>
                  </div>

                  <button
                    onClick={() => startSpeedrun(track)}
                    disabled={starting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50"
                  >
                    Start {track.company_name} Assessment
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
