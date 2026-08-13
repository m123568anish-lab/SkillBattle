"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { battleService } from "@/services/battle.service";

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
      const battle = await battleService.createBattle({
        title,
        difficulty,
        problem_id: Number(problemId),
        max_players: Number(maxPlayers),
      });
      router.push(`/battle/${battle.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to create battle.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl shadow-violet-950/20">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-400">Battle title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none ring-0"
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-400">Difficulty</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none ring-0"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-400">Problem ID</span>
          <input
            type="number"
            value={problemId}
            onChange={(e) => setProblemId(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none ring-0"
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-400">Battle Mode</span>
          <select
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none ring-0"
          >
            <option value="1">Solo 1v1 (+50 XP Winner Reward)</option>
            <option value="2">Duo 2v2 (+100 XP Winner Reward)</option>
            <option value="4">Squad 4v4 (+200 XP Winner Reward)</option>
            <option value="8">Custom Room 8 Players (+300 XP Winner Reward)</option>
          </select>
        </label>
      </div>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create battle"}
      </button>
    </form>
  );
}
