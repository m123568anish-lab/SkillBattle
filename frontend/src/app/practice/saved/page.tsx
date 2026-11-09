"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Breadcrumbs, DifficultyBadge, PracticeNav } from "@/components/arena";
import {
  Bookmark,
  Trash2,
  Play,
  Search,
  Code2,
  Brain,
  Filter,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface SavedItem {
  id: string;
  type: "coding" | "mcq";
  title: string;
  topic: string;
  difficulty: string;
  savedAt: string;
  notes?: string;
  href: string;
}

function SavedQuestionsInner() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "coding" | "mcq">("all");

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const filtered = items.filter((item) => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (query && !item.title.toLowerCase().includes(query.toLowerCase()) && !item.topic.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl space-y-7 p-4 sm:p-7">
        <Breadcrumbs
          items={[
            { label: "Practice Hub", href: "/practice" },
            { label: "Saved Questions", href: "/practice/saved", active: true },
          ]}
        />

        <PracticeNav />

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0E1524] via-[#0B0F17] to-[#141C2E] p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Bookmark className="h-3.5 w-3.5 text-cyan-400" />
                <span>Personal Revision Deck</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Saved Questions
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-slate-300">
                Quickly revisit bookmarked algorithmic edge cases, system design questions, and conceptual drills to reinforce retention.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
              <div className="text-3xl font-black text-white">{items.length}</div>
              <div className="text-xs text-slate-400">Questions Bookmarked</div>
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#0E1524] p-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search saved problems or notes..."
              className="w-full rounded-lg border border-white/10 bg-[#0B0F17] pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center rounded-lg border border-white/10 bg-[#0B0F17] p-0.5">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                typeFilter === "all" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("coding")}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                typeFilter === "coding" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-cyan-400"
              }`}
            >
              Coding
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("mcq")}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                typeFilter === "mcq" ? "bg-purple-500/20 text-purple-300" : "text-slate-400 hover:text-purple-400"
              }`}
            >
              MCQ
            </button>
          </div>
        </div>

        {/* Saved List */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-12 text-center text-slate-400">
            <Bookmark className="h-10 w-10 mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-white">
              {query ? "No saved questions match your search" : "No saved questions yet"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Saved questions will appear here when bookmarking is available for your practice account.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0E1524] p-4 sm:p-5 transition hover:border-cyan-500/30 hover:bg-[#121B2F]"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.type === "coding"
                          ? "bg-cyan-500/15 text-cyan-300"
                          : "bg-purple-500/15 text-purple-300"
                      }`}
                    >
                      {item.type === "coding" ? <Code2 className="h-3 w-3" /> : <Brain className="h-3 w-3" />}
                      {item.type}
                    </span>
                    <DifficultyBadge difficulty={item.difficulty} />
                    <span className="text-xs text-slate-400 font-mono">{item.topic}</span>
                    <span className="text-xs text-slate-600">• Saved {item.savedAt}</span>
                  </div>

                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  {item.notes && (
                    <p className="text-xs text-slate-400 italic font-mono bg-white/5 rounded-lg p-2 mt-1">
                      Note: {item.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 border border-cyan-500/30 px-4 py-2 text-xs font-bold text-cyan-200 hover:text-slate-950 transition"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Practice</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Remove from saved"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}

export default function SavedQuestionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F]" />}>
      <SavedQuestionsInner />
    </Suspense>
  );
}
