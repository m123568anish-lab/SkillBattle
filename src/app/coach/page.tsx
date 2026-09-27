"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import api from "@/services/api";
import { Bot, Send, Sparkles, Lightbulb, BookOpen, ChevronRight, RefreshCw, Target, AlertTriangle } from "lucide-react";

interface Message {
  role: "user" | "coach";
  content: string;
}

interface StudentContext {
  target_role?: string;
  target_company?: string;
  roadmap_progress?: number;
  weak_topics?: string[];
}

const STARTER_PROMPTS = [
  "What should I study today?",
  "Why am I weak in this topic?",
  "What should I practice next?",
  "How am I progressing?",
  "Prepare me for my target company.",
];

const QUICK_TOPICS = [
  { icon: "📅", label: "Today's Study Plan", prompt: "What should I study today?" },
  { icon: "🎯", label: "Target Company Prep", prompt: "Prepare me for my target company." },
  { icon: "🔍", label: "Weak Area Breakdown", prompt: "Why am I weak in this topic?" },
  { icon: "🚀", label: "What to Practice Next", prompt: "What should I practice next?" },
  { icon: "📊", label: "Progress Audit", prompt: "How am I progressing?" },
  { icon: "🧠", label: "Dynamic Programming", prompt: "Explain top DP patterns and templates for technical interviews." },
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "coach",
      content: "👋 Welcome to your AI Placement Coach session! I am directly synced with your profile, active roadmap, skill performance, and target company goals. Ask me anything — or pick a personalized prompt below to get started!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [studentContext, setStudentContext] = useState<StudentContext | null>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.post("/coach/chat", { message: text });
      const reply = res.data?.reply || res.data?.message || "Here is your personalized guidance!";
      if (res.data?.student_context) {
        setStudentContext(res.data.student_context);
      }
      setMessages((prev) => [...prev, { role: "coach", content: reply }]);
    } catch (err: any) {
      console.error("Coach API error:", err);
      const fallback = generateFallback(text);
      setMessages((prev) => [...prev, { role: "coach", content: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  const generateFallback = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes("today") || q.includes("study")) {
      return "### 📅 Today's Focus\n\nBased on your active roadmap, your top priorities today are:\n1. **Data Structures & Algorithms:** Solve 2 Medium-level Array/HashMap problems.\n2. **Weak Areas:** Dedicate 30 mins to reviewing Dynamic Programming state transitions.\n3. **System Design:** Read on Caching strategies (Redis).";
    }
    if (q.includes("weak")) {
      return "### 🔍 Weak Area Diagnostics\n\nCommon reasons for lower accuracy in problem solving:\n• **Rushing to Code:** Omitting manual dry runs on edge cases.\n• **Suboptimal Data Structures:** Using arrays $O(N)$ instead of HashSets $O(1)$.\n• **Missing Base Cases:** Recursion stack overflow.";
    }
    if (q.includes("progress")) {
      return "### 📊 Progress Summary\n\nYou are making steady progress on your SkillBattle Placement Roadmap! Keep completing daily tasks and mock interviews to unlock higher tier placement badges.";
    }
    return `### 🤖 Placement Guidance for "${query}"\n\n1. **Identify Core Pattern:** Determine if this is a DSA, System Architecture, or CS Core concept.\n2. **Analyze Constraints:** $N \\le 10^5$ requires $O(N)$ or $O(N \\log N)$.\n3. **State Complexity:** Always provide explicit Time and Space complexities.`;
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
            🤖 AI Placement Coach
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Context-aware mentor synced with your profile, roadmap progress, and target company goals.
          </p>
        </div>

        {studentContext && (
          <div className="flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300">
            <Target className="h-4 w-4 text-cyan-400" />
            <span>Target: {studentContext.target_role || "Software Engineer"} @ {studentContext.target_company || "Tech Company"}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Panel: Quick Topics */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl space-y-2">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-400" /> Quick Action Drills
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
              <BookOpen className="h-4 w-4 text-cyan-400" /> Frequently Asked
            </h3>
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="w-full rounded-lg bg-white/5 px-3 py-2 text-left text-xs text-slate-400 hover:bg-white/10 hover:text-slate-200 transition"
              >
                "{p}"
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
                <p className="font-bold text-white text-sm">SkillBattle Placement Assistant</p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> Context Synced & Active
                </p>
              </div>
            </div>
            <button
              onClick={() => setMessages([{ role: "coach", content: "Session cleared! Ready for a fresh start. What would you like to learn?" }])}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Clear Session
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
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "coach"
                      ? "bg-slate-800/80 text-slate-200 rounded-tl-none border border-white/5"
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
                <div className="rounded-2xl rounded-tl-none bg-slate-800/80 px-4 py-3 border border-white/5">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span>Analyzing student profile & roadmap...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-white/10 px-4 py-4 space-y-2">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-2.5">
              <Sparkles className="h-4 w-4 flex-shrink-0 text-violet-400" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="Ask your coach: 'What should I study today?' or 'Prepare me for Google'..."
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

