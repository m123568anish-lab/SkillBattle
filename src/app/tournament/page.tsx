"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Trophy, Users, Award, Calendar, Zap, Shield, ChevronRight } from "lucide-react";

export default function TournamentsPage() {
  const [joined, setJoined] = useState(false);

  const tournaments = [
    {
      id: "t1",
      title: "Global Algorithmic Clash 2026",
      prizePool: "$5,000 + FAANG Referrals",
      participants: 256,
      maxParticipants: 512,
      startDate: "Tomorrow at 18:00 UTC",
      status: "Registration Open",
      badge: "Major Tournament",
    },
    {
      id: "t2",
      title: "FAANG Speed Sprint #42",
      prizePool: "10,000 XP + Champion Badge",
      participants: 128,
      maxParticipants: 128,
      startDate: "Live Now",
      status: "IN_PROGRESS",
      badge: "Weekly League",
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
            🏆 Championship Tournaments Arena
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Compete in bracket elimination tournaments for cash prizes, XP, and direct recruiter referrals.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Tournament Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-8 transition-all hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/10 backdrop-blur-xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-300">
                  {t.badge}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Zap className="h-4 w-4" /> {t.status}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">{t.title}</h3>
                <p className="text-sm font-semibold text-yellow-400 mt-1">Prize Pool: {t.prizePool}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-400" />
                  <span>{t.participants} / {t.maxParticipants} Registered</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-400" />
                  <span>{t.startDate}</span>
                </div>
              </div>

              <button
                onClick={() => setJoined(true)}
                className={`w-full rounded-xl py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
                  joined
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20 hover:opacity-90"
                }`}
              >
                {joined ? "✓ Registered for Tournament" : "Enter Tournament Bracket"}
              </button>
            </div>
          ))}
        </div>

        {/* Live Bracket Demo */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-8 backdrop-blur-xl space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" /> Live Championship Bracket Preview
          </h3>

          <div className="grid gap-6 sm:grid-cols-3 text-sm">
            {/* Quarter Finals */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quarter Finals</span>
              <div className="rounded-xl border border-white/10 bg-slate-800/80 p-3 space-y-2">
                <div className="flex justify-between font-bold text-white"><span>CodeMaster</span><span className="text-emerald-400">100</span></div>
                <div className="flex justify-between text-slate-400"><span>AlgoKing</span><span>45</span></div>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-800/80 p-3 space-y-2">
                <div className="flex justify-between font-bold text-white"><span>ByteNinja</span><span className="text-emerald-400">95</span></div>
                <div className="flex justify-between text-slate-400"><span>HackPro</span><span>80</span></div>
              </div>
            </div>

            {/* Semi Finals */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semi Finals</span>
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 space-y-2">
                <div className="flex justify-between font-bold text-white"><span>CodeMaster</span><span className="text-emerald-400">100</span></div>
                <div className="flex justify-between text-slate-400"><span>ByteNinja</span><span>90</span></div>
              </div>
            </div>

            {/* Grand Finals */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Grand Finals</span>
              <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-5 space-y-3">
                <div className="flex justify-between font-extrabold text-white text-base">
                  <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-yellow-400" /> CodeMaster</span>
                  <span className="text-yellow-400">CHAMPION</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
