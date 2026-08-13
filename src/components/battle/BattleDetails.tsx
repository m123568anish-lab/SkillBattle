"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { battleService, type BattleParticipant, type BattleRecord, type BattleTimerData } from "@/services/battle.service";
import BattleDetailClient from "@/components/battle/BattleDetailClient";

interface BattleDetailsProps {
  battleId: string;
}

export default function BattleDetails({ battleId }: BattleDetailsProps) {
  const router = useRouter();
  const [battle, setBattle] = useState<BattleRecord | null>(null);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [timer, setTimer] = useState<BattleTimerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadBattle = async () => {
      try {
        const [battleData, participantsData, timerData] = await Promise.all([
          battleService.getBattle(battleId),
          battleService.getParticipants(battleId),
          battleService.getTimer(battleId),
        ]);

        if (active) {
          setBattle(battleData);
          setParticipants(participantsData);
          setTimer(timerData);
        }
      } catch (err: any) {
        if (active) setError(err?.response?.data?.detail || "Unable to load battle details.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadBattle();
    return () => { active = false; };
  }, [battleId]);

  const handleLeave = async () => {
    try {
      await battleService.leaveBattle(battleId);
      router.push("/battle");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to leave battle.");
    }
  };

  if (loading) return <p className="text-slate-400">Loading battle details...</p>;
  if (error) return <p className="text-red-400">{error}</p>;
  if (!battle) return <p className="text-slate-400">Battle not found.</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl shadow-violet-950/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Battle room</p>
            <h2 className="text-3xl font-semibold">{battle.title}</h2>
            <p className="mt-2 text-slate-400">{battle.difficulty} • Problem #{battle.problem_id} • {battle.status}</p>
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-cyan-200">
            <div className="text-xs uppercase tracking-[0.25em]">Time left</div>
            <div className="text-2xl font-semibold">{timer?.remaining_seconds ?? 0}s</div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold">Challenge overview</h3>
                <p className="mt-3 text-slate-400">Battle through a real-time coding arena with live opponents, score tracking, and a shared countdown clock.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-sm text-slate-400">Mode</div>
                  <div className="mt-1 font-semibold">{battle.difficulty}</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-sm text-slate-400">Players</div>
                  <div className="mt-1 font-semibold">{battle.max_players}</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-sm text-slate-400">Created</div>
                  <div className="mt-1 font-semibold">{battle.created_at ? new Date(battle.created_at).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">Live scoreboard</h3>
                <p className="mt-2 text-slate-400">Track rankings and participant progress as the battle advances.</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200">{participants.length}/{battle.max_players}</span>
            </div>

            <div className="mt-5 space-y-3">
              {participants.length === 0 ? (
                <p className="text-slate-400">No participants have joined yet.</p>
              ) : participants.map((participant) => (
                <div key={participant.id} className="grid gap-3 rounded-3xl bg-slate-900/70 p-4 sm:grid-cols-[1fr_auto]">
                  <div>
                    <div className="font-semibold text-white">Player {participant.user_id.slice(0, 6)}</div>
                    <div className="text-sm text-slate-400">Score {participant.score} • Joined {new Date(participant.joined_at).toLocaleTimeString()}</div>
                  </div>
                  <div className="rounded-full bg-slate-800/70 px-4 py-2 text-sm font-semibold text-violet-300">#{participant.rank}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <h3 className="text-xl font-semibold">Battle feed</h3>
            <p className="mt-2 text-slate-400">Interact with the lobby, send actions, or submit code to the backend while you compete.</p>
            <BattleDetailClient id={battleId} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-semibold">Battle strategy</h3>
            <ul className="mt-4 space-y-3 text-slate-300">
              <li className="rounded-2xl bg-slate-950/70 px-4 py-3">Prioritize code correctness before performance.</li>
              <li className="rounded-2xl bg-slate-950/70 px-4 py-3">Use test submission to verify against the backend quickly.</li>
              <li className="rounded-2xl bg-slate-950/70 px-4 py-3">Keep the room open and watch the live scoreboard update.</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => router.push("/battle")}
          className="w-full rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
        >
          Back to lobby
        </button>
        <button
          onClick={handleLeave}
          className="w-full rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 sm:w-auto"
        >
          Leave battle
        </button>
      </div>
    </div>
  );
}
