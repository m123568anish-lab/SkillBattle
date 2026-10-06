"use client";

import React, { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { api } from "@/lib/api";
import { useDashboardStore } from "@/store/dashboardStore";
import toast from "react-hot-toast";
import { Play, Send, Code2, Terminal, Sparkles, CheckCircle2, XCircle } from "lucide-react";

function buildWsUrl(id: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const wsBase = base.replace(/^http/, "ws");
  return `${wsBase}/api/v1/battle/ws/${id}`;
}

let wsErrorShown = false;

export default function BattleDetailClient({ id }: { id: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [players, setPlayers] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const [editorLang, setEditorLang] = useState("python");
  const [source, setSource] = useState("def solve():\n    # Write your solution here\n    pass\n");
  const [lastResult, setLastResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    wsErrorShown = false;
    let ws: WebSocket;

    try {
      const url = buildWsUrl(id);
      ws = new WebSocket(url);
    } catch {
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      wsErrorShown = false;
      setMessages((m) => [...m, { system: true, text: "Connected to battle room websocket." }]);
    };

    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        const { event, data } = payload;
        if (event === "battle_finished") {
          void useDashboardStore.getState().refresh();
        }
        if (event === "player_joined" || event === "player_left") {
          setPlayers(data.players ?? 0);
        }
        setMessages((m) => [...m, { event, data }]);
      } catch {
        setMessages((m) => [...m, { raw: ev.data }]);
      }
    };

    ws.onclose = () => {
      setMessages((m) => [...m, { system: true, text: "Disconnected from battle." }]);
    };

    ws.onerror = () => {
      if (!wsErrorShown) {
        wsErrorShown = true;
        toast.error("Battle server connection unavailable.");
      }
    };

    return () => {
      wsErrorShown = false;
      ws.close();
    };
  }, [id]);

  function sendEvent(event: string, data: any) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ event, data }));
  }

  async function submitCode() {
    if (!source.trim() || submitting) return;
    setSubmitting(true);
    try {
      const resp = await api.post("/compiler/submit", {
        battle_id: id,
        language: editorLang,
        source_code: source,
      });
      setLastResult(resp.data);
      const xpEarned = Number(resp.data?.xp_earned || 0);
      if (xpEarned > 0) {
        toast.success(`Solution accepted! +${xpEarned} XP`);
        await useDashboardStore.getState().refresh();
      } else {
        toast.success("Submission evaluated.");
      }
    } catch (err) {
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="py-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-white shadow-xl backdrop-blur">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-400">
            <Code2 size={16} /> Battle Room #{id}
          </div>
          <h1 className="mt-1 text-2xl font-black">Multiplayer Coding Duel</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300">
            Active Players: {players}
          </div>
          <button
            onClick={() => sendEvent("player_action", { type: "ping" })}
            className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-bold hover:bg-slate-700 text-white"
          >
            Ping Room
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Editor & Execution Column */}
        <div className="lg:col-span-8 space-y-4 flex flex-col">
          <div className="rounded-3xl border border-white/10 bg-slate-950 overflow-hidden shadow-2xl flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-4 py-3">
              <div className="flex items-center gap-3">
                <label className="sr-only" htmlFor="battle-detail-lang">Language</label>
                <select
                  id="battle-detail-lang"
                  value={editorLang}
                  onChange={(e) => setEditorLang(e.target.value)}
                  className="rounded-xl border border-white/15 bg-slate-950 px-3 py-1.5 text-xs font-bold text-cyan-300 focus:outline-none"
                >
                  <option value="python">Python 3</option>
                  <option value="cpp">C++ 17</option>
                  <option value="java">Java 17</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>

              <button
                onClick={submitCode}
                disabled={submitting || !source.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-xs font-black text-slate-950 hover:brightness-110 disabled:opacity-50"
              >
                <Send size={14} /> {submitting ? "Evaluating..." : "Submit Code"}
              </button>
            </div>

            <div className="relative flex-1 min-h-[360px]">
              <Editor
                height="100%"
                language={editorLang === "javascript" ? "javascript" : editorLang}
                theme="vs-dark"
                value={source}
                onChange={(val) => setSource(val || "")}
                options={{
                  minimap: { enabled: false },
                  automaticLayout: true,
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>
          </div>

          {/* Submission Verdict Card */}
          {lastResult && (
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-xs font-mono text-white">
              <div className="flex items-center gap-2 mb-1 font-sans">
                {lastResult.verdict === "Accepted" ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <XCircle size={16} className="text-rose-400" />
                )}
                <span className="font-bold text-sm">{lastResult.verdict}</span>
              </div>
              <p className="text-slate-400 font-sans">
                Passed {lastResult.passed_tests} / {lastResult.total_tests} test cases · {lastResult.execution_time_ms || 45} ms
              </p>
            </div>
          )}
        </div>

        {/* WebSocket Activity & AI Mentor Sidebar Column */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Live Battle Feed */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur shadow-xl">
            <h3 className="flex items-center gap-2 text-sm font-black text-white mb-3">
              <Terminal size={15} className="text-cyan-400" /> Live Room Feed
            </h3>
            <div className="rounded-2xl bg-slate-950 p-3 h-48 overflow-y-auto font-mono text-xs text-slate-300 space-y-2 border border-white/5">
              {messages.map((m, idx) => (
                <div key={idx} className="border-b border-white/5 pb-1.5">
                  {m.system ? (
                    <span className="text-slate-500">{m.text}</span>
                  ) : m.event ? (
                    <span className="text-cyan-300">
                      [{m.event}] <span className="text-slate-400">{JSON.stringify(m.data)}</span>
                    </span>
                  ) : (
                    <span>{m.raw}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Mentor Widget */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur shadow-xl">
            <h3 className="flex items-center gap-2 text-sm font-black text-white mb-3">
              <Sparkles size={15} className="text-cyan-400" /> AI Battle Mentor
            </h3>
            <AiMentor />
          </div>
        </aside>
      </div>
    </div>
  );
}

function AiMentor() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim() || loading) return;
    setLoading(true);
    try {
      const resp = await api.post("/career/mentor", {
        resume_id: "",
        question,
      });
      setAnswer(resp.data.answer);
    } catch {
      setAnswer("Could not reach AI mentor at this moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 text-xs">
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-slate-200 focus:border-cyan-400 focus:outline-none h-20"
        placeholder="Ask AI Mentor for algorithm hints or complexity tips..."
      />
      <button
        onClick={ask}
        disabled={loading || !question.trim()}
        className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-2.5 disabled:opacity-50 transition-all"
      >
        {loading ? "Thinking..." : "Ask AI Mentor"}
      </button>

      {answer && (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-3 text-slate-200 leading-relaxed font-sans">
          {answer}
        </div>
      )}
    </div>
  );
}
