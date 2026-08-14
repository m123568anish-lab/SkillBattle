"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Lock, Play, X, Zap, ChevronLeft, Award } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { campaignService, type CampaignStatusResponse, type LevelStatus, type TrackStatus } from "@/services/campaign.service";
import toast from "react-hot-toast";

// Free Fire Rank Styling Map
const RANK_STYLES: Record<string, { bg: string; text: string; glow: string; border: string; desc: string }> = {
  Bronze: {
    bg: "from-amber-800 to-amber-950",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
    border: "border-amber-700/30",
    desc: "Recruit Coder - Level up to climb!",
  },
  Silver: {
    bg: "from-slate-500 to-slate-700",
    text: "text-slate-200",
    glow: "shadow-slate-400/20",
    border: "border-slate-500/30",
    desc: "Apprentice Developer - Moving up.",
  },
  Gold: {
    bg: "from-yellow-600 to-yellow-950",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/20",
    border: "border-yellow-500/30",
    desc: "Elite Specialist - Coding with power.",
  },
  Platinum: {
    bg: "from-teal-600 to-teal-950",
    text: "text-teal-400",
    glow: "shadow-teal-500/30",
    border: "border-teal-500/30",
    desc: "Master Technologist - Expert skills.",
  },
  Diamond: {
    bg: "from-cyan-600 to-cyan-950",
    text: "text-cyan-400",
    glow: "shadow-cyan-400/40",
    border: "border-cyan-500/30",
    desc: "Apex Champion - Flawless logic.",
  },
  Heroic: {
    bg: "from-rose-700 to-red-950",
    text: "text-rose-400",
    glow: "shadow-red-500/50",
    border: "border-red-500/40",
    desc: "Grandmaster Competitor - Arena legend.",
  },
  Grandmaster: {
    bg: "from-violet-700 to-fuchsia-950",
    text: "text-fuchsia-400",
    glow: "shadow-fuchsia-500/60 animate-pulse",
    border: "border-fuchsia-500/50",
    desc: "Godlike Entity - Undefeated SDE.",
  },
};

// SVG curve coords for S-shape level map (10 levels)
const LEVEL_COORDS = [
  { x: 50, y: 85 },
  { x: 30, y: 72 },
  { x: 45, y: 58 },
  { x: 70, y: 48 },
  { x: 60, y: 35 },
  { x: 30, y: 22 },
  { x: 45, y: 8 },
];

// Extra level map positions to cover 10 levels
const LEVEL_POSITIONS = [
  { left: "50%", bottom: "5%" },
  { left: "30%", bottom: "14%" },
  { left: "20%", bottom: "24%" },
  { left: "45%", bottom: "34%" },
  { left: "70%", bottom: "44%" },
  { left: "80%", bottom: "54%" },
  { left: "55%", bottom: "64%" },
  { left: "30%", bottom: "74%" },
  { left: "25%", bottom: "84%" },
  { left: "50%", bottom: "92%" },
];

export default function CampaignPage() {
  const router = useRouter();
  const [status, setStatus] = useState<CampaignStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"DSA" | "OS" | "DBMS">("DSA");
  const [selectedLevel, setSelectedLevel] = useState<LevelStatus | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await campaignService.getCampaignStatus();
        if (active) setStatus(data);
      } catch (err: any) {
        toast.error("Failed to load campaign data");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[75vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <p className="mt-5 text-slate-400">Syncing Arena Campaign...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentTrack = status?.tracks.find((t) => t.track === activeTab);
  const rankStyle = RANK_STYLES[status?.rank || "Bronze"] || RANK_STYLES.Bronze;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Banner with Free Fire Rank Display */}
        <div className={`relative rounded-3xl border bg-gradient-to-r ${rankStyle.bg} ${rankStyle.border} p-8 overflow-hidden shadow-xl ${rankStyle.glow}`}>
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/80">
                Solo Campaign Mode
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                SkillBattle Arena Campaign
              </h1>
              <p className="text-sm text-slate-300 max-w-md">
                Clear subject nodes to acquire stars, progress up the ranks, and prepare for interviews!
              </p>
            </div>

            {/* Rank Emblem */}
            <div className="flex items-center gap-4 bg-black/40 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
              <div className="rounded-xl bg-white/10 p-3 border border-white/10">
                <Award size={36} className={`${rankStyle.text} animate-bounce`} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Current Rank</span>
                <span className={`text-2xl font-black ${rankStyle.text} tracking-wider`}>
                  {status?.rank.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">{status?.points} Campaign Points</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection & Stats Grid */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex bg-[#0A0E1A]/80 border border-white/10 rounded-2xl p-1.5 w-full sm:w-auto">
            {(["DSA", "OS", "DBMS"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab === "DBMS" ? "MySQL / DBMS" : tab}
              </button>
            ))}
          </div>

          <div className="text-slate-400 text-sm font-semibold">
            Track Progress: <span className="text-cyan-400 font-bold">{currentTrack?.current_level || 1}</span> / 10 Completed
          </div>
        </div>

        {/* Level map */}
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#141414] shadow-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 border-b border-white/5 bg-[#1F1F1F] px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-7">Title</div>
              <div className="col-span-2 text-center">Difficulty</div>
              <div className="col-span-2 text-center">Action</div>
            </div>
            
            <div className="divide-y divide-white/5">
              {currentTrack?.levels.map((lvl, index) => {
                const isUnlocked = lvl.unlocked;
                const isSolved = lvl.stars > 0;
                
                // Mocking difficulty for visual variety
                const diff = index % 3 === 0 ? "Hard" : index % 2 === 0 ? "Medium" : "Easy";
                const diffColor = diff === "Easy" ? "text-emerald-400" : diff === "Medium" ? "text-yellow-400" : "text-rose-400";

                return (
                  <div 
                    key={lvl.level_id} 
                    className={`grid grid-cols-12 items-center gap-4 px-6 py-4 transition ${
                      isUnlocked ? "hover:bg-white/[0.02]" : "opacity-50 grayscale cursor-not-allowed"
                    }`}
                  >
                    <div className="col-span-1 flex justify-center">
                      {isSolved ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      ) : isUnlocked ? (
                        <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                      ) : (
                        <Lock size={14} className="text-slate-600" />
                      )}
                    </div>
                    
                    <div className="col-span-7">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isUnlocked ? "text-white" : "text-slate-500"}`}>
                          {lvl.level_id}. {lvl.title}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500 max-w-[90%]">{lvl.description}</p>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className={`text-xs font-medium ${isUnlocked ? diffColor : "text-slate-600"}`}>
                        {diff}
                      </span>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      {isUnlocked ? (
                        <button
                          onClick={() => router.push(`/campaign/level/${activeTab.toLowerCase()}/${lvl.level_id}`)}
                          className="rounded-lg bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-bold text-white hover:bg-white/10 hover:border-cyan-500/30 transition shadow-sm"
                        >
                          {isSolved ? "Solve Again" : "Solve"}
                        </button>
                      ) : (
                        <button disabled className="rounded-lg bg-transparent border border-white/5 px-4 py-1.5 text-xs font-medium text-slate-600">
                          Locked
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!currentTrack && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <Trophy size={32} className="text-slate-600" />
                <p className="text-slate-400 text-sm max-w-xs">Campaign data unavailable. Make sure you are logged in and the backend is running.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
