"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  clearBattleCreationKey,
  createBattleWithRetry,
  getBattleCreationKey,
} from "@/services/battle.service";

export default function CreateBattleClient() {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const router = useRouter();

  async function create() {
    try {
      const request = { title, difficulty };
      const idempotencyKey = getBattleCreationKey("legacy-create", request);
      const battle = await createBattleWithRetry<{ id: string }>(request, idempotencyKey);
      clearBattleCreationKey("legacy-create", idempotencyKey);
      toast.success("Battle created");
      router.push(`/battle/${battle.id}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to create");
    }
  }

  return (
    <div className="p-6 sm:p-8 rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] max-w-3xl mx-auto text-[var(--text-primary)]">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-5">Create Custom Battle</h2>
      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Battle Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Dynamic Programming Faceoff"
          className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="w-full sm:w-48 rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div>
        <button
          onClick={create}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--text-on-accent)] transition hover:opacity-90"
        >
          Create Battle Room
        </button>
      </div>
    </div>
  );
}
