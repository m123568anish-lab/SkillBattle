"use client";

import React, { useState, useCallback } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useBattleSocket, type BattleSocketMessage } from "@/hooks/useBattleSocket";

interface ScoreEntry {
  user_id: string;
  score: number;
  rank: number;
}

interface BattleResult {
  winner: string | null;
  draw: boolean;
  rewards: Array<{ user_id: string; xp: number; rating_change: number; winner: boolean }>;
  leaderboard: ScoreEntry[];
}

export default function BattleDetailClient({ id }: { id: string }) {
  const [messages, setMessages] = useState<Array<{ system?: boolean; text?: string; event?: string; data?: unknown }>>([]);
  const [players, setPlayers] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [editorLang, setEditorLang] = useState("python");
  const [source, setSource] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastVerdict, setLastVerdict] = useState<{ verdict: string; passed_tests: number; total_tests: number } | null>(null);

  const handleMessage = useCallback((msg: BattleSocketMessage) => {
    const { event, data } = msg;

    setMessages((m) => [...m.slice(-49), { event, data }]);

    if (event === "player_joined" || event === "player_left") {
      setPlayers((data.players as number) ?? 0);
    }

    if (event === "timer_updated") {
      setRemainingSeconds((data.remaining_seconds as number) ?? null);
    }

    if (event === "score_updated") {
      const entries = data as unknown as ScoreEntry[];
      setLeaderboard(Array.isArray(entries) ? entries : []);
    }

    if (event === "state_sync") {
      // Restore full state after reconnect
      if (typeof data.remaining_seconds === "number") {
        setRemainingSeconds(data.remaining_seconds);
      }
      if (typeof data.players === "number") {
        setPlayers(data.players);
      }
      setMessages((m) => [...m, { system: true, text: "Reconnected — state restored" }]);
      toast.success("Reconnected to battle");
    }

    if (event === "battle_finished") {
      setResult(data as unknown as BattleResult);
      setRemainingSeconds(0);
    }

    if (event === "forfeit") {
      const uid = data.forfeiting_user_id as string;
      toast(`Player ${uid?.slice(0, 6)} forfeited`, { icon: "🏳️" });
    }

    if (event === "battle_started") {
      const dur = data.duration as number;
      if (dur) setRemainingSeconds(dur);
      setMessages((m) => [...m, { system: true, text: "Battle started!" }]);
    }
  }, []);

  const { connected, sendEvent } = useBattleSocket({
    battleId: id,
    onMessage: handleMessage,
  });

  async function submitCode() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const resp = await api.post("/battle/submit", {
        battle_id: id,
        language: editorLang,
        source_code: source,
      });
      const data = resp.data as { verdict?: string; passed_tests?: number; total_tests?: number };
      setLastVerdict({
        verdict: data.verdict ?? "unknown",
        passed_tests: data.passed_tests ?? 0,
        total_tests: data.total_tests ?? 0,
      });
      if (data.verdict === "accepted") {
        toast.success("Accepted! 🎉 XP will be awarded at battle end.");
      } else {
        toast.error(`Verdict: ${data.verdict}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Format remaining seconds as MM:SS
  function formatTime(seconds: number | null): string {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <div className="py-6 space-y-6">
      {/* Battle Result Overlay */}
      {result && (
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6">
          <h3 className="text-xl font-bold text-emerald-300">
            {result.draw ? "Draw!" : "Battle Over!"}
          </h3>
          <div className="mt-3 space-y-2">
            {result.rewards.map((r) => (
              <div key={r.user_id} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-slate-400">{r.user_id.slice(0, 8)}</span>
                {r.winner && <span className="text-yellow-400 font-bold">👑 Winner</span>}
                <span className="text-emerald-300">+{r.xp} XP</span>
                <span className={r.rating_change >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {r.rating_change >= 0 ? "+" : ""}{r.rating_change} rating
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: timer + feed + editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">Battle Arena</h2>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                connected ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
              }`}>
                {connected ? "● Live" : "○ Connecting…"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm">Players: {players}</span>
              <div className={`text-2xl font-mono font-bold ${
                (remainingSeconds ?? Infinity) < 60 ? "text-red-400 animate-pulse" : "text-cyan-300"
              }`}>
                {formatTime(remainingSeconds)}
              </div>
            </div>
          </div>

          {/* Live scoreboard */}
          {leaderboard.length > 0 && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <h4 className="text-sm font-semibold text-slate-400 mb-3">Live Scoreboard</h4>
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div key={entry.user_id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-mono">#{entry.rank} {entry.user_id.slice(0, 8)}</span>
                    <span className="font-bold text-violet-300">{entry.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event feed */}
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-4 h-40 overflow-auto">
            <h4 className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Event Feed</h4>
            {messages.map((m, idx) => (
              <div key={idx} className="text-xs mb-1">
                {m.system ? (
                  <span className="text-slate-400 italic">{m.text}</span>
                ) : (
                  <span>
                    <span className="text-violet-400 font-semibold">{m.event}</span>
                    <span className="text-slate-500"> — {JSON.stringify(m.data)}</span>
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Code editor */}
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Code Editor</h4>
              <select
                value={editorLang}
                onChange={(e) => setEditorLang(e.target.value)}
                className="rounded-lg bg-slate-800 border border-white/10 px-2 py-1 text-sm"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full h-48 rounded-xl bg-black/60 border border-white/10 p-3 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Write your solution here…"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={submitCode}
                disabled={submitting || !source.trim() || !!result}
                className="rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-5 py-2 text-sm font-semibold transition"
              >
                {submitting ? "Submitting…" : "Submit Solution"}
              </button>
              <button
                onClick={() => sendEvent("ping", { ts: Date.now() })}
                className="rounded-full border border-white/10 hover:bg-white/10 px-4 py-2 text-sm transition"
              >
                Ping
              </button>
            </div>
            {lastVerdict && (
              <div className={`mt-3 text-sm ${
                lastVerdict.verdict === "accepted" ? "text-emerald-400" : "text-red-400"
              }`}>
                Verdict: {lastVerdict.verdict} — {lastVerdict.passed_tests}/{lastVerdict.total_tests} tests passed
              </div>
            )}
          </div>
        </div>

        {/* Right panel: AI Mentor */}
        <aside className="rounded-2xl bg-slate-900/80 border border-white/10 p-4">
          <h3 className="font-semibold mb-3">AI Mentor</h3>
          <AiMentor />
        </aside>
      </div>
    </div>
  );
}

function AiMentor() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [industry, setIndustry] = useState<string>("software");

  async function ask() {
    setLoading(true);
    try {
      const prompt = `Industry: ${industry}\nQuestion: ${question}`;
      const resp = await api.post("/career/mentor", {
        resume_id: "",
        question: prompt,
      });
      const data = resp.data as { answer?: string };
      setAnswer(data.answer ?? "No answer received.");
    } catch (err) {
      console.error(err);
      setAnswer("Failed to get advice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Industry</label>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-white/10 px-2 py-1 text-sm"
        >
          <option value="software">Software</option>
          <option value="finance">Finance</option>
          <option value="data">Data Science</option>
          <option value="devops">DevOps</option>
        </select>
      </div>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full rounded-xl bg-slate-800/80 border border-white/10 p-2 h-24 text-sm resize-none"
        placeholder="Ask career or strategy advice…"
      />
      <button
        onClick={ask}
        disabled={loading || !question.trim()}
        className="w-full rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3 py-2 text-sm font-semibold transition"
      >
        {loading ? "Thinking…" : "Ask AI"}
      </button>
      {answer && (
        <div className="rounded-xl bg-slate-800/60 p-3 text-sm text-slate-300 whitespace-pre-wrap">{answer}</div>
      )}
    </div>
  );
}
