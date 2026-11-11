"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Trophy,
  Swords,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Flame,
} from "lucide-react";
import {
  battleService,
  type BattleParticipant,
  type BattleRecord,
  type BattleTimerData,
} from "@/services/battle.service";
import BattleDetailClient from "@/components/battle/BattleDetailClient";
import { SpotlightCard } from "@/components/ui/spotlight";

interface BattleDetailsProps {
  battleId: string;
}

export default function BattleDetails({ battleId }: BattleDetailsProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
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
        if (active)
          setError(
            err?.response?.data?.detail || "Unable to load battle details."
          );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadBattle();
    return () => {
      active = false;
    };
  }, [battleId]);

  const handleLeave = async () => {
    try {
      await battleService.leaveBattle(battleId);
      router.push("/battle");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to leave battle.");
    }
  };

  if (loading)
    return (
      <div className="flex items-center gap-3 py-12 text-sm text-[var(--text-muted)]">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        Connecting to battle room…
      </div>
    );
  if (error)
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300">
        <div className="flex items-center gap-2 font-bold">
          <AlertCircle size={18} /> Error loading battle
        </div>
        <p className="mt-1 text-xs text-rose-200/80">{error}</p>
        <button
          onClick={() => router.push("/battle")}
          className="mt-4 rounded-xl border border-rose-400/30 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500/20"
        >
          Return to Arena Lobby
        </button>
      </div>
    );
  if (!battle)
    return (
      <div className="py-12 text-sm text-[var(--text-muted)]">
        Battle not found.
      </div>
    );

  const remainingSeconds = timer?.remaining_seconds ?? 0;
  const isUrgentTimer = remainingSeconds <= 10 && remainingSeconds > 0;
  const isMatchCompleted =
    battle.status === "completed" ||
    (battle.status === "in_progress" && remainingSeconds === 0);

  return (
    <div className="space-y-6">
      {/* Match Completion Celebration Banner */}
      <AnimatePresence>
        {isMatchCompleted && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -8 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -8 }}
            className="relative overflow-hidden rounded-[24px] border border-[var(--accent)]/40 bg-[var(--surface-card)] p-4 shadow-xl sm:rounded-3xl sm:p-6"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/10 via-[var(--accent-strong)]/5 to-transparent pointer-events-none"
            />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/20 text-[var(--accent-strong)] border border-[var(--accent)]/40 shadow-[0_0_16px_rgba(200,239,114,0.3)]">
                  <Trophy size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                    Match Concluded
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Official rankings and verified ratings submitted to the server.
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/40 px-3.5 py-1 text-xs font-bold text-[var(--accent-strong)]">
                <CheckCircle2 size={14} /> Settlement Verified
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Room Header */}
      <SpotlightCard className="rounded-[24px] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-xl sm:rounded-3xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                Live Duel Room
              </p>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
            </div>
            <h1 className="mt-1 break-words text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {battle.title}
            </h1>
            <p className="mt-1.5 break-words text-[11px] font-medium leading-relaxed text-[var(--text-secondary)] sm:text-xs">
              Mode: <span className="text-[var(--text-primary)] font-semibold capitalize">{battle.difficulty}</span> · Problem #{battle.problem_id} · Status:{" "}
              <span className="font-semibold uppercase tracking-wider text-[var(--accent-strong)]">
                {battle.status}
              </span>
            </p>
          </div>

          {/* Animated Countdown Clock */}
          <div
            className={`shrink-0 rounded-2xl border px-4 py-2.5 transition-colors duration-200 sm:px-5 sm:py-3 ${
              isUrgentTimer
                ? "border-rose-500/50 bg-rose-500/15 text-rose-300 animate-pulse shadow-[0_0_16px_rgba(244,63,94,0.3)]"
                : "border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--text-primary)]"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <Clock size={12} /> Time Remaining
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight mt-0.5">
              {remainingSeconds}s
            </div>
          </div>
        </div>
      </SpotlightCard>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] sm:gap-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-lg sm:rounded-3xl sm:p-6 sm:shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Challenge Overview</h3>
                <p className="mt-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                  Compete in real time with live contestants, score tracking, and verified automated evaluation.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Difficulty</div>
                  <div className="mt-0.5 text-xs font-bold text-[var(--text-primary)] capitalize">{battle.difficulty}</div>
                </div>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Max Slots</div>
                  <div className="mt-0.5 text-xs font-bold text-[var(--text-primary)]">{battle.max_players}</div>
                </div>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Created</div>
                  <div className="mt-0.5 text-xs font-bold text-[var(--text-primary)]">
                    {battle.created_at ? new Date(battle.created_at).toLocaleDateString() : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Scoreboard */}
          <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-lg sm:rounded-3xl sm:p-6 sm:shadow-xl">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Live Scoreboard</h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Track live player submissions and score updates.
                </p>
              </div>
              <span className="rounded-full bg-[var(--surface-elevated)] border border-[var(--border-default)] px-3 py-1 text-xs font-bold text-[var(--accent-strong)]">
                {participants.length} / {battle.max_players} Players
              </span>
            </div>

            <div className="mt-5 space-y-2.5">
              {participants.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] py-4 text-center">
                  Waiting for competitors to join the lobby…
                </p>
              ) : (
                participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 transition-all duration-150 hover:border-[var(--accent)]/30"
                  >
                    <div>
                      <div className="text-sm font-bold text-[var(--text-primary)]">
                        Player {participant.user_id.slice(0, 6)}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                        Score: <span className="text-[var(--accent-strong)] font-semibold">{participant.score}</span> · Joined{" "}
                        {new Date(participant.joined_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-default)] px-3 py-1.5 text-xs font-mono font-bold text-[var(--accent-strong)]">
                      #{participant.rank}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Feed & Interaction */}
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-lg sm:rounded-3xl sm:p-6 sm:shadow-xl">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Battle Feed & Terminal</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)] mb-4">
              Real-time telemetry and execution output.
            </p>
            <BattleDetailClient id={battleId} problemId={battle.problem_id} />
          </div>

          <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-lg sm:rounded-3xl sm:p-6 sm:shadow-xl">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Strategic Guidelines</h3>
            <ul className="mt-3.5 space-y-2 text-xs text-[var(--text-secondary)]">
              <li className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3.5 py-2.5">
                • Prioritize algorithm correctness and boundary conditions before optimizing execution runtime.
              </li>
              <li className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3.5 py-2.5">
                • Run test submissions to verify sample cases before sending an authoritative final submission.
              </li>
              <li className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3.5 py-2.5">
                • Keep your connection active; disconnects during a live battle automatically record the current score.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Navigation & Leave Actions */}
      <div className="flex flex-col gap-3 sm:flex-row pt-2">
        <button
          onClick={() => router.push("/battle")}
          className="min-h-11 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-5 py-2.5 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--surface-elevated)]"
        >
          Back to Battle Arena
        </button>
        <button
          onClick={handleLeave}
          className="min-h-11 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 hover:border-rose-400/50"
        >
          Leave Battle
        </button>
      </div>
    </div>
  );
}
