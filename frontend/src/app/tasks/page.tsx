"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import api from "@/lib/api";
import { practiceService, type PracticeProblem, type PracticeProblemDetail } from "@/services/practice.service";
import { 
  CheckCircle2, 
  Code2, 
  Play, 
  Search, 
  Send, 
  Terminal, 
  Sparkles, 
  RotateCcw, 
  AlertCircle,
  Clock,
  Cpu,
  Award
} from "lucide-react";

const Monaco = dynamic(() => import("@monaco-editor/react"), { 
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[360px] items-center justify-center rounded-xl bg-slate-950 font-mono text-xs text-slate-500">
      Loading Monaco Editor...
    </div>
  )
});

const DEFAULT_STARTER_CODES: Record<string, string> = {
  python: `def solution():\n    # Read input from stdin\n    # line = input()\n    pass\n\nif __name__ == "__main__":\n    solution()\n`,
  javascript: `const fs = require("fs");\n\nfunction solution() {\n    const input = fs.readFileSync(0, "utf-8").trim();\n    // Parse input and print result\n}\nsolution();\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Read input and print result\n    return 0;\n}\n`,
  java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input and print result\n    }\n}\n`,
};

const LANGUAGES = ["python", "javascript", "cpp", "java"];

export default function TasksPage() {
  const params = useSearchParams();
  const router = useRouter();
  const requested = Number(params.get("problem"));

  const [items, setItems] = useState<PracticeProblem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<PracticeProblemDetail | null>(null);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("all");
  const [summary, setSummary] = useState<{ solved: number; attempted: number; accuracy: number | null } | null>(null);

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [activeTab, setActiveTab] = useState<"output" | "custom_input">("output");
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submissionResult, setSubmissionResult] = useState<{
    verdict?: string;
    passed_tests?: number;
    total_tests?: number;
    execution_time?: number;
    memory_used?: number;
    xp_earned?: number;
  } | null>(null);

  const load = async () => {
    try {
      setLoadingList(true);
      const [catalog, stats] = await Promise.all([
        practiceService.list({
          q: query || undefined,
          difficulty: difficulty || undefined,
          category: category || undefined,
          status,
        }),
        practiceService.summary(),
      ]);
      setItems(catalog.items || []);
      setCategories(catalog.categories || []);
      setSummary(stats);
    } catch {
      setMessage("Practice catalogue could not be loaded. Please ensure backend is reachable.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [query, difficulty, category, status]);

  const open = async (id: number) => {
    try {
      setLoadingDetail(true);
      setMessage("");
      setSubmissionResult(null);
      setOutput("");

      const detail = await practiceService.get(id);
      setSelected(detail);

      // Determine initial language and code with reliable fallbacks
      const availableLangs = Object.keys(detail.starter_codes || {});
      const initialLang = availableLangs.includes(language) 
        ? language 
        : (availableLangs[0] || "python");

      setLanguage(initialLang);
      setCode(detail.starter_codes?.[initialLang] || DEFAULT_STARTER_CODES[initialLang] || "");

      router.replace(`/tasks${params.get("daily") === "1" ? "?daily=1&" : "?"}problem=${id}`);
    } catch {
      setMessage("Selected problem could not be loaded.");
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (requested && (!selected || selected.id !== requested)) {
      void open(requested);
    }
  }, [requested]);

  const changeLanguage = (next: string) => {
    setLanguage(next);
    if (selected) {
      setCode(selected.starter_codes?.[next] || DEFAULT_STARTER_CODES[next] || "");
    }
  };

  const resetCode = () => {
    if (selected) {
      setCode(selected.starter_codes?.[language] || DEFAULT_STARTER_CODES[language] || "");
    }
  };

  const run = async () => {
    if (!selected || running || submitting) return;
    setRunning(true);
    setActiveTab("output");
    setOutput("Executing test code in secure environment...");

    try {
      const r = await api.post("/compiler/run", {
        language,
        source_code: code,
        stdin: input,
        custom_input: true,
      });

      const out = r.data.stderr || r.data.stdout || r.data.status || "Execution finished with no output.";
      setOutput(out);
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.message || "Execution request failed.";
      setOutput(`Error: ${errMsg}`);
    } finally {
      setRunning(false);
    }
  };

  const submit = async () => {
    if (!selected || running || submitting) return;
    setSubmitting(true);
    setActiveTab("output");
    setOutput("Submitting code to authoritative judge engine...");
    setMessage("");

    try {
      const r = (await api.post("/compiler/submit", {
        problem_id: selected.id,
        language,
        source_code: code,
      })).data;

      setSubmissionResult(r);

      const verdictText = `${r.verdict} — Passed ${r.passed_tests}/${r.total_tests} tests (${r.execution_time} ms)`;
      setOutput(verdictText);

      if (r.verdict === "Accepted") {
        setMessage(`🎉 Accepted! +${r.xp_earned} XP awarded to your profile.`);
        await load();
      } else {
        setMessage(`Verdict: ${r.verdict}. Try again or inspect sample tests.`);
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail || "Submission could not be evaluated.";
      setOutput(`Submission Error: ${detail}`);
      setMessage(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="min-h-screen p-4 sm:p-7">
        <div className="mx-auto max-w-7xl space-y-5">
          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                Placement & DSA Practice Workspace
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Curated Problem Catalog
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-300">
                Solved: <span className="text-emerald-400 font-bold">{summary?.solved ?? "—"}</span> · 
                Accuracy: <span className="text-cyan-400 font-bold">{summary?.accuracy == null ? "—" : `${summary.accuracy}%`}</span>
              </div>
            </div>
          </header>

          {/* Main Workspace Split */}
          <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
            {/* Sidebar: Problems List & Filters */}
            <aside className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 backdrop-blur-md">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search problem title..."
                  className="w-full rounded-xl bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 outline-none border border-white/5 focus:border-cyan-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="rounded-lg bg-slate-950 p-2 text-xs text-slate-300 border border-white/5 outline-none"
                >
                  <option value="">All Levels</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg bg-slate-950 p-2 text-xs text-slate-300 border border-white/5 outline-none"
                >
                  <option value="">All Topics</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg bg-slate-950 p-2 text-xs text-slate-300 border border-white/5 outline-none"
              >
                <option value="all">All Progress</option>
                <option value="unsolved">Unsolved</option>
                <option value="attempted">Attempted</option>
                <option value="solved">Solved</option>
              </select>

              {/* Problem List Items */}
              <div className="max-h-[64vh] space-y-2 overflow-y-auto pr-1">
                {loadingList ? (
                  <div className="py-12 text-center text-xs text-slate-400">Loading catalog...</div>
                ) : items.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">No matching problems found.</div>
                ) : (
                  items.map((item) => {
                    const isSelected = selected?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => void open(item.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? "border-cyan-400 bg-cyan-400/10 shadow-sm"
                            : "border-white/5 bg-slate-950/60 hover:border-white/20 hover:bg-slate-950"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <strong className="text-sm font-semibold text-white leading-tight">
                            {item.id}. {item.title}
                          </strong>
                          <CheckCircle2
                            size={16}
                            className={`shrink-0 mt-0.5 ${
                              item.status === "solved"
                                ? "text-emerald-400"
                                : item.status === "attempted"
                                ? "text-amber-400"
                                : "text-slate-700"
                            }`}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{item.category} · {item.difficulty}</span>
                          <span className="font-bold text-cyan-300">+{item.xp_reward} XP</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Problem View + Code Editor Pane */}
            <section className="rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden backdrop-blur-md">
              {loadingDetail ? (
                <div className="flex min-h-[650px] items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                    <p className="text-xs text-slate-400">Loading problem details...</p>
                  </div>
                </div>
              ) : selected ? (
                <div className="grid min-h-[680px] lg:grid-cols-2">
                  {/* Left Column: Problem Statement & Examples */}
                  <article className="max-h-[720px] overflow-y-auto border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                        {selected.category} · {selected.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-300">
                        <Award size={14} /> +{selected.xp_reward} XP
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-black text-white">{selected.title}</h2>
                    
                    <div className="mt-5 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                      {selected.description}
                    </div>

                    <div className="mt-6 space-y-4">
                      {selected.input_format && (
                        <div>
                          <h3 className="text-xs font-bold uppercase text-slate-400">Input Format</h3>
                          <p className="mt-1 text-xs leading-relaxed text-slate-300 bg-slate-950 p-3 rounded-lg border border-white/5">
                            {selected.input_format}
                          </p>
                        </div>
                      )}

                      {selected.output_format && (
                        <div>
                          <h3 className="text-xs font-bold uppercase text-slate-400">Output Format</h3>
                          <p className="mt-1 text-xs leading-relaxed text-slate-300 bg-slate-950 p-3 rounded-lg border border-white/5">
                            {selected.output_format}
                          </p>
                        </div>
                      )}

                      {selected.constraints && (
                        <div>
                          <h3 className="text-xs font-bold uppercase text-slate-400">Constraints</h3>
                          <pre className="mt-1 text-xs leading-relaxed text-slate-300 bg-slate-950 p-3 rounded-lg border border-white/5 font-mono">
                            {selected.constraints}
                          </pre>
                        </div>
                      )}

                      {/* Sample Test Cases */}
                      {selected.samples && selected.samples.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold uppercase text-cyan-300">Sample Test Cases</h3>
                          <div className="mt-2 space-y-3">
                            {selected.samples.map((s, i) => (
                              <div key={i} className="rounded-lg bg-slate-950 p-3 border border-white/5 space-y-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Example {i + 1}</span>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-semibold">Input:</span>
                                  <pre className="text-xs font-mono text-cyan-200 mt-0.5">{s.input}</pre>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-semibold">Expected Output:</span>
                                  <pre className="text-xs font-mono text-emerald-300 mt-0.5">{s.output}</pre>
                                </div>
                                {s.explanation && (
                                  <p className="text-xs text-slate-400 italic pt-1 border-t border-white/5">
                                    Explanation: {s.explanation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>

                  {/* Right Column: Code Editor & Terminal */}
                  <article className="flex flex-col p-4 bg-[#0B0F19]">
                    {/* Editor Toolbar */}
                    <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <Code2 size={16} className="text-cyan-400" />
                        <select
                          value={language}
                          onChange={(e) => changeLanguage(e.target.value)}
                          className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-bold text-cyan-300 border border-white/10 outline-none"
                        >
                          {LANGUAGES.map((lang) => (
                            <option key={lang} value={lang}>
                              {lang === "cpp" ? "C++" : lang.charAt(0).toUpperCase() + lang.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={resetCode}
                        title="Reset code template"
                        className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-xs text-slate-400 hover:text-white transition"
                      >
                        <RotateCcw size={12} /> Reset
                      </button>
                    </div>

                    {/* Monaco Editor Container */}
                    <div className="min-h-[340px] flex-1 overflow-hidden rounded-xl border border-white/10 bg-slate-950">
                      <Monaco
                        height="100%"
                        language={language === "cpp" ? "cpp" : language}
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => setCode(val || "")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          lineNumbers: "on",
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                        }}
                      />
                    </div>

                    {/* Terminal / Test Case Input / Output */}
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2 border-b border-white/5 pb-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab("output")}
                          className={`text-xs font-bold px-3 py-1 rounded-md transition ${
                            activeTab === "output"
                              ? "bg-white/10 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Execution Output
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("custom_input")}
                          className={`text-xs font-bold px-3 py-1 rounded-md transition ${
                            activeTab === "custom_input"
                              ? "bg-white/10 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Custom Test Input
                        </button>
                      </div>

                      {activeTab === "custom_input" ? (
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Provide custom input lines for Run Code..."
                          className="h-24 w-full rounded-xl bg-slate-950 p-3 font-mono text-xs text-white border border-white/5 outline-none focus:border-cyan-500/30"
                        />
                      ) : (
                        <div className="h-24 overflow-y-auto rounded-xl bg-slate-950 p-3 font-mono text-xs text-slate-300 border border-white/5">
                          {output || "Click 'Run Code' to test against custom input, or 'Submit Solution' to evaluate all tests."}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                      <div className="text-xs">
                        {message && (
                          <span className={message.startsWith("🎉") ? "text-emerald-400 font-bold" : "text-amber-300"}>
                            {message}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void run()}
                          disabled={running || submitting}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40 transition"
                        >
                          <Play size={13} />
                          {running ? "Running..." : "Run Code"}
                        </button>

                        <button
                          type="button"
                          onClick={() => void submit()}
                          disabled={running || submitting}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/10 hover:opacity-90 disabled:opacity-40 transition"
                        >
                          <Send size={13} />
                          {submitting ? "Evaluating..." : "Submit Solution"}
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              ) : (
                <div className="flex min-h-[580px] flex-col items-center justify-center p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
                    <Code2 size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-white">Choose a problem from the catalog</h2>
                  <p className="mt-2 max-w-sm text-xs text-slate-400 leading-relaxed">
                    Select any DSA problem on the left to review instructions, test cases, and write code in Python, C++, Java, or JavaScript.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
