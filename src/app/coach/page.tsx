"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import api from "@/services/api";
import { Bot, Send, Sparkles, Code2, Lightbulb, BookOpen, ChevronRight, RefreshCw } from "lucide-react";

interface Message {
  role: "user" | "coach";
  content: string;
}

const STARTER_PROMPTS = [
  "Explain Big O notation with examples",
  "How do I approach Dynamic Programming problems?",
  "What's the best way to prepare for FAANG interviews?",
  "Explain Dijkstra's algorithm step by step",
  "How do I optimize a slow SQL query?",
];

const QUICK_TOPICS = [
  { icon: "🧠", label: "DP Patterns", prompt: "Teach me the most common Dynamic Programming patterns used in FAANG interviews" },
  { icon: "🌲", label: "Trees & Graphs", prompt: "Give me a complete guide on Tree and Graph traversal algorithms with code" },
  { icon: "🔍", label: "Binary Search", prompt: "Explain all variants of Binary Search with examples" },
  { icon: "📊", label: "System Design", prompt: "How do I approach a system design interview for a URL shortener?" },
  { icon: "💾", label: "SQL Mastery", prompt: "Teach me advanced SQL: window functions, CTEs, and query optimization" },
  { icon: "⚡", label: "Time Complexity", prompt: "Walk me through how to analyze and improve time/space complexity" },
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "coach",
      content: "👋 Welcome to your AI Coaching session! I'm your personal mentor for algorithmic thinking, system design, and interview prep. Ask me anything — or pick a topic below to get started!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/coach/chat", { message: text });
      const reply = res.data?.reply || res.data?.message || "I understand. Let me help you with that concept!";
      setMessages((prev) => [...prev, { role: "coach", content: reply }]);
    } catch {
      // Provide a helpful fallback response
      const fallback = generateFallback(text);
      setMessages((prev) => [...prev, { role: "coach", content: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  const generateFallback = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes("dp") || q.includes("dynamic")) return "**Dynamic Programming** breaks complex problems into overlapping subproblems. Key patterns: Fibonacci (memoization), Knapsack (tabulation), LCS (2D DP), Matrix Chain (interval DP). Always define: state, transition, and base case.";
    if (q.includes("graph") || q.includes("tree")) return "**Graph Traversal**: Use BFS for shortest path in unweighted graphs (queue-based), DFS for connected components, cycle detection (stack/recursion). For trees: preorder (root → left → right), inorder (sorted BST output), postorder (delete/height).";
    if (q.includes("big o") || q.includes("complexity")) return "**Big O** measures how runtime/space grows with input size. O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2^n). Tips: nested loops = O(n²), halving = O(log n), divide & conquer = O(n log n).";
    if (q.includes("sql")) return "**Advanced SQL**: Window functions (`ROW_NUMBER()`, `RANK()`, `LAG()`) run without collapsing rows. CTEs (`WITH cte AS (...)`) improve readability. Indexing: create indexes on WHERE/JOIN columns. EXPLAIN ANALYZE shows query plan.";
    return `Great question! To tackle **"${query}"** effectively: 1) Break it into smaller pieces, 2) Identify the data structure that fits, 3) Think about edge cases, 4) Analyze time/space complexity. Would you like a deeper dive on any specific aspect?`;
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
          🤖 AI Coach
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Your personal mentor for algorithms, system design, and interview mastery.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Panel: Quick Topics */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl space-y-2">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-400" /> Quick Topics
            </h3>
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic.label}
                onClick={() => sendMessage(topic.prompt)}
                className="w-full flex items-center gap-2.5 rounded-xl border border-white/5 bg-slate-800/50 px-3 py-2.5 text-left text-sm font-medium text-slate-300 hover:bg-slate-700/60 hover:text-white transition"
              >
                <span className="text-base">{topic.icon}</span>
                <span className="flex-1">{topic.label}</span>
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl space-y-2">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-400" /> Try Asking...
            </h3>
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="w-full rounded-lg bg-white/5 px-3 py-2 text-left text-xs text-slate-400 hover:bg-white/10 hover:text-slate-200 transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel: Chat Window */}
        <div className="lg:col-span-3 flex flex-col rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl overflow-hidden" style={{ height: "75vh" }}>
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">BattleAI Coach</p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setMessages([{ role: "coach", content: "Session cleared! Ready for a fresh start. What would you like to learn?" }])}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> New Session
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "coach" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 mt-0.5">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "coach"
                      ? "bg-slate-800/80 text-slate-200 rounded-tl-none"
                      : "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-violet-500/20"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-slate-800/80 px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-white/10 px-4 py-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-2.5">
              <Sparkles className="h-4 w-4 flex-shrink-0 text-violet-400" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="Ask anything — algorithms, complexity, system design..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:opacity-90 transition disabled:opacity-30"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-600">Press Enter to send · Ctrl+K for quick commands</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
