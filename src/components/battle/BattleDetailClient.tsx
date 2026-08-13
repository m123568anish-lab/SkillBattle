"use client";

import React, { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

function buildWsUrl(id: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const wsBase = base.replace(/^http/, "ws");
  return `${wsBase}/api/v1/battle/ws/${id}`;
}

// Whether we already showed the WS error toast for this session
let wsErrorShown = false;

export default function BattleDetailClient({ id }: { id: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [players, setPlayers] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const [editorLang, setEditorLang] = useState("python");
  const [source, setSource] = useState("");
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    wsErrorShown = false;
    let ws: WebSocket;

    try {
      const url = buildWsUrl(id);
      ws = new WebSocket(url);
    } catch {
      // Invalid URL or environment — skip silently
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      wsErrorShown = false;
      setMessages((m) => [...m, { system: true, text: "Connected to battle" }]);
    };

    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        const { event, data } = payload;
        if (event === "player_joined" || event === "player_left") {
          setPlayers(data.players ?? 0);
        }
        setMessages((m) => [...m, { event, data }]);
      } catch {
        setMessages((m) => [...m, { raw: ev.data }]);
      }
    };

    ws.onclose = () => {
      setMessages((m) => [...m, { system: true, text: "Disconnected" }]);
    };

    ws.onerror = () => {
      // The native WebSocket Event object logs as `{}` — avoid that.
      // Only show the toast once per connection lifecycle.
      if (!wsErrorShown) {
        wsErrorShown = true;
        toast.error("Battle server unavailable. Please try again later.");
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
    try {
      const resp = await api.post("/compiler/submit", {
        battle_id: id,
        language: editorLang,
        source_code: source,
      });
      setLastResult(resp.data);
      // Award XP for battle completion
      try {
        await api.post("/xp/add", { amount: 100 });
        toast.success("Solution Submitted! +100 XP Earned! 🏆");
      } catch {
        toast.success("Submitted successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Submission failed");
    }
  }

  return (
    <div className="py-8 max-w-5xl mx-auto grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Battle {id}</h2>
          <div>Players: {players}</div>
        </div>

        <div className="rounded bg-gray-900 p-4 h-96 overflow-auto">
          {messages.map((m, idx) => (
            <div key={idx} className="mb-2">
              {m.system ? (
                <div className="text-sm text-gray-400">{m.text}</div>
              ) : m.event ? (
                <div className="text-sm">{m.event}: {JSON.stringify(m.data)}</div>
              ) : (
                <div className="text-sm">{m.raw}</div>
              )}
            </div>
          ))}
        </div>

        <div className="flex space-x-2">
          <button onClick={() => sendEvent("player_action", { type: "ping" })} className="rounded bg-emerald-600 px-3 py-1">Ping</button>
        </div>

        <div className="rounded bg-gray-900 p-4">
          <h4 className="font-semibold mb-2">Submit Code</h4>
          <div className="mb-2">
            <label className="block text-sm">Language</label>
            <select id="lang" className="mt-1 w-40 rounded bg-gray-800 px-2 py-1" defaultValue="python" onChange={(e)=>setEditorLang(e.target.value)}>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
            </select>
          </div>
          <textarea value={source} onChange={(e)=>setSource(e.target.value)} className="w-full h-40 rounded bg-black p-2 text-sm" placeholder="Write your solution here..." />
          <div className="mt-2">
            <button onClick={submitCode} className="rounded bg-blue-600 px-3 py-1">Submit</button>
          </div>
          {lastResult && (
            <div className="mt-2 text-sm">Result: {lastResult.verdict} — Passed {lastResult.passed_tests}/{lastResult.total_tests}</div>
          )}
        </div>
      </div>

      <aside className="col-span-1 rounded bg-gray-900 p-4">
        <h3 className="font-semibold mb-2">AI Mentor</h3>
        <AiMentor />
      </aside>
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
      setAnswer(resp.data.answer);
    } catch (err) {
      console.error(err);
      setAnswer("Failed to get advice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-2">
        <label className="block text-sm">Industry</label>
        <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="mt-1 w-full rounded bg-gray-800 px-2 py-1">
          <option value="software">Software</option>
          <option value="finance">Finance</option>
          <option value="data">Data Science</option>
          <option value="devops">DevOps</option>
        </select>
      </div>
      <textarea value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full rounded bg-gray-800 p-2 h-24" placeholder="Ask career or industry advice..." />
      <div className="mt-2 flex space-x-2">
        <button onClick={ask} disabled={loading || !question} className="rounded bg-blue-600 px-3 py-1">Ask</button>
      </div>

      {answer && (
        <div className="mt-4 rounded bg-gray-800 p-3 text-sm">{answer}</div>
      )}
    </div>
  );
}
