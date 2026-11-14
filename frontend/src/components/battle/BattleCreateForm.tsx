"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  battleService,
  clearBattleCreationKey,
  getBattleCreationKey,
} from "@/services/battle.service";

export default function BattleCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("My Battle Room");
  const [difficulty, setDifficulty] = useState("Medium");
  const [problemId, setProblemId] = useState("101");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const request = {
        title,
        difficulty,
        problem_id: Number(problemId),
        max_players: Number(maxPlayers),
        battle_mode: Number(maxPlayers) === 1
          ? "solo"
          : Number(maxPlayers) === 2
            ? "duo"
            : "squad",
      };
      const idempotencyKey = getBattleCreationKey("legacy-new-battle", request);
      const battle = await battleService.createBattle(request, idempotencyKey);
      clearBattleCreationKey("legacy-new-battle", idempotencyKey);
      router.push(`/battle/${battle.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to create battle.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 sm:p-8 text-[var(--text-primary)] shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Battle title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Difficulty</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Problem ID</span>
          <input
            type="number"
            value={problemId}
            onChange={(e) => setProblemId(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Battle Mode</span>
          <select
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
          >
            <option value="1">Solo 1v1 (+50 XP Winner Reward)</option>
            <option value="2">Duo 2v2 (+100 XP Winner Reward)</option>
            <option value="4">Squad 4v4 (+200 XP Winner Reward)</option>
            <option value="8">Custom Room 8 Players (+300 XP Winner Reward)</option>
          </select>
        </label>
      </div>

      {error ? <p className="mt-4 text-xs font-semibold text-[var(--status-danger)]">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-xl bg-[var(--accent)] px-6 py-3 font-bold text-sm text-[var(--text-on-accent)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create battle room"}
      </button>
    </form>
  );
}
