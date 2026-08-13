"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Swords, Map, Trophy, Star, Lock, ChevronRight } from "lucide-react";
import { battleService } from "@/services/battle.service";
import { campaignService, type TrackStatus } from "@/services/campaign.service";
import BattleMatchmakingClient from "@/components/battle/BattleMatchmakingClient";

type ActiveTab = "arena" | "campaign";

export default function BattleLobby() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("arena");
  const [error, setError] = useState<string | null>(null);
  const [joiningBattleId, setJoiningBattleId] = useState<string | null>(null);

  // Campaign state
  const [campaignTrack, setCampaignTrack] = useState<"DSA" | "OS" | "DBMS">("DSA");
  const [campaignData, setCampaignData] = useState<TrackStatus[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignRank, setCampaignRank] = useState("Bronze");

  useEffect(() => {
    if (activeTab !== "campaign") return;
    setCampaignLoading(true);
    campaignService.getCampaignStatus().then((data) => {
      setCampaignData(data.tracks);
      setCampaignRank(data.rank);
    }).catch(() => {}).finally(() => setCampaignLoading(false));
  }, [activeTab]);

  const currentTrack = useMemo(() => campaignData.find((t) => t.track === campaignTrack), [campaignData, campaignTrack]);

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

  return (
    <section className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-[#0A0E1A]/80 border border-white/10 w-full sm:w-auto">
        <button
          onClick={() => setActiveTab("arena")}
          className={`flex items-center gap-2.5 flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "arena"
              ? "bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Swords size={15} />
          Battle Arena
        </button>
        <button
          onClick={() => setActiveTab("campaign")}
          className={`flex items-center gap-2.5 flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "campaign"
              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Map size={15} />
          Campaign Quest Map
        </button>
      </div>

      {/* ── ARENA TAB ── */}
      {activeTab === "arena" && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl shadow-violet-950/20">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Live Battles & Campaign</p>
              <h2 className="text-2xl font-semibold">Join a challenge</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push("/battle/solo")}
                className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition transform hover:scale-105"
              >
                ⚡ Enter Solo Battle (Coding & MCQs)
              </button>
              <button
                onClick={() => router.push("/battle/new")}
                className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Create Multiplayer Battle
              </button>
            </div>
          </div>
          <div className="mb-6">
            <BattleMatchmakingClient />
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 text-slate-300">
            Live waiting battle cards are hidden for now. Use the matchmaking controls above to start a match.
          </div>
        </div>
      )}

      {/* ── CAMPAIGN TAB ── */}
      {activeTab === "campaign" && (
        <div className="space-y-6">
          {/* Rank banner */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-[#0D1226] to-[#070B14] p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">SkillBattle Arena Campaign</p>
              <h2 className="text-xl font-black text-white mt-1">Earn stars, level up, rank up!</h2>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/5 px-5 py-3">
              <Trophy size={22} className="text-yellow-400" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Rank</span>
                <span className="text-lg font-black text-yellow-300 uppercase tracking-wider">{campaignRank}</span>
              </div>
            </div>
          </div>

          {/* Track tabs */}
          <div className="flex bg-[#0A0E1A]/80 border border-white/10 rounded-2xl p-1.5 w-full sm:w-auto">
            {(["DSA", "OS", "DBMS"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setCampaignTrack(tab)}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  campaignTrack === tab
                    ? "bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab === "DBMS" ? "MySQL / DBMS" : tab}
              </button>
            ))}
          </div>

          {campaignLoading ? (
            <div className="flex h-60 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#141414] shadow-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 border-b border-white/5 bg-[#1F1F1F] px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-6">Title</div>
                <div className="col-span-2 text-center">Difficulty</div>
                <div className="col-span-3 text-center">Action</div>
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
                      
                      <div className="col-span-6">
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

                      <div className="col-span-3 flex justify-center">
                        {isUnlocked ? (
                          <button
                            onClick={() => router.push(`/campaign/level/${campaignTrack.toLowerCase()}/${lvl.level_id}`)}
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
                  <Map size={32} className="text-slate-600" />
                  <p className="text-slate-400 text-sm max-w-xs">Campaign data unavailable. Make sure you are logged in and the backend is running.</p>
                </div>
              )}
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => router.push("/campaign")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
            >
              Open Full Campaign Map <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
