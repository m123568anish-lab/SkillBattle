"use client";

import { useEffect, useState } from "react";
import { Trophy, Users, Award, Calendar, Zap, Shield, ChevronRight, Target, Crown } from "lucide-react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { tournamentService } from "@/services/tournament.service";

export default function TournamentsPage() {
  const [joined, setJoined] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<Array<{
    id: string;
    title: string;
    description?: string;
    difficulty?: string;
    prizePool?: string;
    participants?: number;
    maxParticipants?: number;
    startDate?: string;
    status?: string;
    badge?: string;
    accent?: string;
  }>>([]);

  useEffect(() => {
    let active = true;

    async function loadTournaments() {
      try {
        const result = await tournamentService.listTournaments();
        if (!active || !Array.isArray(result) || !result.length) return;

        const mapped = result.slice(0, 4).map((tour, index) => ({
          id: tour.id ?? `${index}`,
          title: tour.title ?? `Tournament ${index + 1}`,
          description: tour.description ?? "Live competitive bracket.",
          difficulty: tour.difficulty ?? "Medium",
          prizePool: tour.prizePool ?? `${tour.max_players ?? 128} player bracket`,
          participants: typeof tour.participants === "number" ? tour.participants : (tour.max_players ?? 128) - 10,
          maxParticipants: tour.max_players ?? 128,
          startDate: tour.starts_at ? new Date(tour.starts_at).toLocaleString() : "Live",
          status: tour.status ?? "REGISTRATION",
          badge: tour.tournament_type ? tour.tournament_type.replace(/_/g, " ") : "Tournament",
          accent: index % 2 === 0 ? "from-violet-500/20 to-fuchsia-500/10" : "from-cyan-500/20 to-sky-500/10",
        }));

        setTournaments(mapped);
      } catch {
        // keep the page empty if the backend does not host a live tournament yet
      }
    }

    void loadTournaments();
    return () => {
      active = false;
    };
  }, []);

  const leaderboard: Array<{ name: string; score: string; tag: string }> = [];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8 text-white">
        <section className="relative overflow-hidden rounded-[32px] border border-violet-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.22),_transparent_24%),radial-gradient(circle_at_right,_rgba(34,211,238,0.18),_transparent_30%),linear-gradient(135deg,#0b1120_0%,#111827_32%,#090d18_100%)] p-7 shadow-[0_30px_90px_rgba(76,29,149,0.18)]">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)]" />

          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-violet-200">
                <Trophy size={12} />
                Championship circuit
              </div>

              <h1 className="text-4xl font-black tracking-[-0.06em] text-white md:text-5xl">
                Tournament Arena
              </h1>

              <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
                Register for real competitions, track live brackets, and turn your preparation into measurable competitive progress.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setJoined((current) => (current && tournaments[0] ? null : tournaments[0]?.id ?? null))}
                className="rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:scale-[1.01]"
              >
                {joined ? "Registered" : tournaments[0] ? "Join featured tournament" : "No live tournament"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Registered players", value: tournaments.reduce((sum, tournament) => sum + (tournament.participants ?? 0), 0).toLocaleString(), icon: Users, tone: "text-cyan-200" },
            { label: "Prize pool", value: tournaments.length ? tournaments[0]?.prizePool ?? "Open" : "No data", icon: Award, tone: "text-violet-200" },
            { label: "Live rounds", value: tournaments.length ? String(tournaments.length) : "0", icon: Zap, tone: "text-emerald-200" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="rounded-[24px] border border-white/10 bg-[#0d1729]/90 p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{label}</span>
                <Icon className={`h-5 w-5 ${tone}`} />
              </div>
              <p className="mt-4 text-3xl font-black text-white">{value}</p>
            </div>
          ))}
        </section>

        {tournaments.length === 0 ? (
          <section className="rounded-[28px] border border-dashed border-white/15 bg-[#0d1729]/80 p-8 text-slate-300">
            <h3 className="text-2xl font-black text-white">No tournaments available right now.</h3>
            <p className="mt-3 max-w-2xl text-slate-400">Check back when a tournament is created, or continue your solo and quest preparation in the battle arena.</p>
          </section>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            {tournaments.map((t) => (
              <div
                key={t.id}
                className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${t.accent ?? "from-violet-500/20 to-fuchsia-500/10"} p-6 backdrop-blur-xl shadow-[0_20px_40px_rgba(15,23,42,0.35)]`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-200">
                    {t.badge ?? "Tournament"}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Zap className="h-4 w-4" /> {t.status ?? "OPEN"}
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="text-2xl font-black text-white">{t.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-yellow-300">Prize Pool: {t.prizePool ?? "Open"}</p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-y border-white/10 py-4 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-400" />
                    <span>{t.participants ?? 0} / {t.maxParticipants ?? 0} registered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-300" />
                    <span>{t.startDate ?? "Live"}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Shield className="h-4 w-4 text-emerald-300" />
                    Verified-only bracket entry
                  </div>
                  <button
                    type="button"
                    onClick={() => setJoined((current) => (current === t.id ? null : t.id))}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                      joined === t.id
                        ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                        : "bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20 hover:opacity-90"
                    }`}
                  >
                    {joined === t.id ? "✓ Registered" : "Enter bracket"}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-[#0d1729]/90 p-6">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-violet-200">
              <Crown className="h-4 w-4" /> Live bracket
            </div>

            {leaderboard.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-5 text-slate-400">
                Bracket data is not available yet. The tournament system will publish live rounds when a real competition starts.
              </div>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-slate-300">Bracket data will appear here when the backend starts a live tournament.</div>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#0d1729]/90 p-6">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">
              <Target className="h-4 w-4" /> Top leaderboard
            </div>

            {leaderboard.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-5 text-slate-400">
                No leaderboard data is available for this tournament yet.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {leaderboard.map((player, index) => (
                  <div key={player.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-sm font-black text-white">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-white">{player.name}</p>
                        <p className="text-xs text-slate-400">{player.tag}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-cyan-200">{player.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
