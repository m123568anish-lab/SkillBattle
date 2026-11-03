"use client";

import { useCallback, useEffect, useState } from "react";
import { Trophy, Users, Calendar, Zap, Shield, ChevronRight, Target, Crown } from "lucide-react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { tournamentService, type TournamentRecord } from "@/services/tournament.service";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyTournamentId, setBusyTournamentId] = useState<string | null>(null);

  const loadTournaments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTournaments(await tournamentService.listTournaments());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load tournaments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTournaments();
  }, [loadTournaments]);

  const toggleRegistration = async (tournament: TournamentRecord) => {
    setBusyTournamentId(tournament.id);
    setError(null);
    try {
      if (tournament.is_registered) {
        await tournamentService.leaveTournament(tournament.id);
      } else {
        await tournamentService.joinTournament(tournament.id);
      }
      await loadTournaments();
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "Tournament registration could not be updated.",
      );
    } finally {
      setBusyTournamentId(null);
    }
  };

  const registeredPlayers = tournaments.reduce(
    (sum, tournament) => sum + tournament.registered_players,
    0,
  );
  const openRegistrations = tournaments.filter(
    (tournament) => tournament.status.toLowerCase() === "registration",
  ).length;

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

          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Registrations", value: registeredPlayers.toLocaleString(), icon: Users, tone: "text-cyan-200" },
            { label: "Open registration", value: String(openRegistrations), icon: Trophy, tone: "text-violet-200" },
            { label: "Tournaments", value: String(tournaments.length), icon: Zap, tone: "text-emerald-200" },
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

        {loading ? (
          <section aria-live="polite" className="rounded-[28px] border border-white/10 bg-[#0d1729]/80 p-8 text-slate-300">
            Loading tournaments…
          </section>
        ) : error ? (
          <section role="alert" className="rounded-[28px] border border-rose-500/30 bg-rose-950/30 p-8 text-slate-200">
            <p>{error}</p>
            <button type="button" onClick={() => void loadTournaments()} className="mt-4 rounded-lg bg-white/10 px-4 py-2 font-semibold hover:bg-white/15">
              Retry
            </button>
          </section>
        ) : tournaments.length === 0 ? (
          <section className="rounded-[28px] border border-dashed border-white/15 bg-[#0d1729]/80 p-8 text-slate-300">
            <h3 className="text-2xl font-black text-white">No tournaments available right now.</h3>
            <p className="mt-3 max-w-2xl text-slate-400">A tournament will appear here when an administrator creates one.</p>
          </section>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            {tournaments.map((t) => (
              <div key={t.id} className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 p-6 backdrop-blur-xl shadow-[0_20px_40px_rgba(15,23,42,0.35)]">
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-200">
                    {t.tournament_type.replace(/_/g, " ")}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Zap className="h-4 w-4" /> {t.status}
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="text-2xl font-black text-white">{t.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{t.description}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-violet-200">{t.difficulty}</p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-y border-white/10 py-4 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-400" />
                    <span>{t.registered_players} / {t.max_players} registered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-300" />
                    <span>{new Date(t.starts_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Shield className="h-4 w-4 text-emerald-300" />
                    Registration closes {new Date(t.registration_end).toLocaleString()}
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleRegistration(t)}
                    disabled={
                      busyTournamentId === t.id
                      || (!t.is_registered && (
                        t.status.toLowerCase() !== "registration"
                        || t.registered_players >= t.max_players
                      ))
                    }
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                      t.is_registered
                        ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                        : "bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20 hover:opacity-90"
                    }`}
                  >
                    {busyTournamentId === t.id
                      ? "Saving…"
                      : t.is_registered
                        ? "Leave tournament"
                        : "Enter bracket"}
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

            <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-5 text-slate-400">
              Tournament bracket data is not available through the current API.
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#0d1729]/90 p-6">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">
              <Target className="h-4 w-4" /> Top leaderboard
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-5 text-slate-400">
              Tournament standings are not available through the current API.
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
