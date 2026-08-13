"use client";
import { useState } from "react";
import { adminService, DailyChallengePayload } from "@/services/admin.service";

export default function DailyChallengeForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [category, setCategory] = useState("Algorithms");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      await adminService.setDailyChallenge({ title, difficulty, category });
      setMsg({ text: "Daily challenge set successfully!", type: "success" });
      setTitle("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMsg({ text: err?.response?.data?.detail || "Failed to update daily challenge", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl">
      <h3 className="mb-4 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 flex items-center gap-2">
        🎯 Set Daily Challenge
      </h3>
      {msg && (
        <div className={`mb-4 rounded-xl p-3 text-sm ${msg.type === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"}`}>
          {msg.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Challenge Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Reverse Linked List II"
            className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Dynamic Programming"
              className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 hover:shadow-cyan-500/30 transition duration-200 disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish Challenge"}
        </button>
      </form>
    </div>
  );
}
