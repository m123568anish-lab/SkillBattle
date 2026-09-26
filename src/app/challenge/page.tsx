"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { problemService, Problem, Submission, SubmitCodeResponse } from "@/services/problem.service";
import {
  Code2,
  FileText,
  Terminal,
  Play,
  Send,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  History,
  Filter,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";

const STARTER_CODE: Record<string, string> = {
  python: `def solve_challenge(input_data):\n    # Write your algorithm solution here\n    return input_data\n\n# Test input\nprint(solve_challenge("Hello SkillBattle"))\n`,
  javascript: `function solveChallenge(inputData) {\n    // Write your algorithm solution here\n    return inputData;\n}\n\nconsole.log(solveChallenge("Hello SkillBattle"));\n`,
  cpp: `#include <iostream>\n#include <string>\n\nusing namespace std;\n\nint main() {\n    cout << "Hello SkillBattle" << endl;\n    return 0;\n}\n`,
  java: `public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello SkillBattle");\n    }\n}\n`,
};

export default function PracticePage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>(STARTER_CODE.python);
  const [output, setOutput] = useState<string>("");
  const [lastResult, setLastResult] = useState<SubmitCodeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"statement" | "editor" | "history">("statement");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [probData, subData] = await Promise.all([
        problemService.getProblems().catch(() => []),
        problemService.getMySubmissions().catch(() => []),
      ]);

      setProblems(probData);
      setSubmissions(subData);

      if (probData.length > 0) {
        setSelectedProblem(probData[0]);
      }
    } catch (err) {
      console.error("Failed to load practice data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProblem = async (problem: Problem) => {
    try {
      const fullProblem = await problemService.getProblem(problem.id);
      setSelectedProblem(fullProblem);
      setLastResult(null);
      setOutput("");
    } catch {
      setSelectedProblem(problem);
    }
  };

  const handleLangChange = (lang: string) => {
    setLanguage(lang);
    setCode(STARTER_CODE[lang] || "");
  };

  const handleRun = async () => {
    if (!selectedProblem) return;
    setRunning(true);
    setOutput("Executing test code in sandbox...");
    try {
      const res = await problemService.runCode(language, code, selectedProblem.input_format || "");
      setOutput(res.stdout || res.stderr || res.output || `Execution status: ${res.status}`);
    } catch (err: any) {
      setOutput(`Execution error: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProblem) return;
    setSubmitting(true);
    setOutput("Submitting code to judge engine...");
    try {
      const result = await problemService.submitCode(selectedProblem.id, language, code);
      setLastResult(result);

      if (result.verdict === "Accepted") {
        setOutput(`✅ VERDICT: ACCEPTED!\nPassed ${result.passed_tests}/${result.total_tests} Test Cases.\n🎉 +${result.xp_earned} XP Awarded!`);
      } else {
        setOutput(`❌ VERDICT: ${result.verdict}\nPassed ${result.passed_tests}/${result.total_tests} Test Cases.`);
      }

      // Refresh user submissions history directly from PostgreSQL
      const updatedSubmissions = await problemService.getMySubmissions().catch(() => []);
      setSubmissions(updatedSubmissions);
    } catch (err: any) {
      setOutput(`❌ Submission error: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProblems = problems.filter((p) => {
    const matchCat = selectedCategory === "All" || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchDiff = selectedDifficulty === "All" || p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchDiff && matchSearch;
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
            💻 Practice & Problem Solving Arena
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Master Data Structures & Algorithms, submit code, earn XP, and track your progress.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
          <Filter className="h-4 w-4 text-cyan-400" /> Filters:
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white focus:border-cyan-400 outline-none"
        >
          <option value="All">All Categories</option>
          <option value="Arrays">Arrays</option>
          <option value="Strings">Strings</option>
          <option value="Stack">Stack</option>
          <option value="Search">Search</option>
          <option value="Dynamic Programming">Dynamic Programming</option>
        </select>

        {/* Difficulty Filter */}
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white focus:border-cyan-400 outline-none"
        >
          <option value="All">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search problems by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Problem List (4 cols) */}
          <div className="lg:col-span-4 space-y-3 max-h-[750px] overflow-y-auto pr-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Available Problems ({filteredProblems.length})
            </h2>

            {filteredProblems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
                No matching problems found.
              </div>
            ) : (
              filteredProblems.map((prob) => (
                <div
                  key={prob.id}
                  onClick={() => handleSelectProblem(prob)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    selectedProblem?.id === prob.id
                      ? "border-cyan-400/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
                      : "border-white/5 bg-slate-900/50 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">#{prob.id}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        prob.difficulty === "Hard"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : prob.difficulty === "Medium"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                  </div>

                  <h3 className="mt-2 font-bold text-white text-sm">{prob.title}</h3>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{prob.category}</span>
                    <span className="font-bold text-yellow-400 flex items-center gap-1">
                      <Zap className="h-3 w-3" /> +{prob.xp_reward} XP
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Problem Workspace & Editor (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedProblem ? (
              <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-6">
                {/* Header & Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-300">
                        {selectedProblem.category}
                      </span>
                      <span className="text-xs font-bold text-slate-400">Problem #{selectedProblem.id}</span>
                    </div>
                    <h2 className="text-2xl font-black text-white mt-1">{selectedProblem.title}</h2>
                  </div>

                  {/* Workspace Tabs */}
                  <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-950 p-1">
                    {[
                      { id: "statement", label: "Statement", icon: FileText },
                      { id: "editor", label: "Editor", icon: Code2 },
                      { id: "history", label: `History (${submissions.length})`, icon: History },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as typeof activeTab)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            activeTab === tab.id
                              ? "bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <Icon size={14} /> {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab 1: Statement */}
                {activeTab === "statement" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                      <p className="text-sm leading-relaxed text-slate-200">{selectedProblem.description}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Input Format</h4>
                        <pre className="text-xs text-cyan-300 font-mono whitespace-pre-wrap">{selectedProblem.input_format}</pre>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Output Format</h4>
                        <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap">{selectedProblem.output_format}</pre>
                      </div>
                    </div>

                    {selectedProblem.constraints && (
                      <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Constraints</h4>
                        <p className="text-xs text-slate-300 font-mono">{selectedProblem.constraints}</p>
                      </div>
                    )}

                    {selectedProblem.explanation && (
                      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 text-xs leading-6 text-violet-200">
                        💡 <strong>Explanation / Approach:</strong> {selectedProblem.explanation}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Code Editor & Execution */}
                {activeTab === "editor" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-400">Language:</label>
                        <select
                          value={language}
                          onChange={(e) => handleLangChange(e.target.value)}
                          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white focus:border-cyan-400 outline-none"
                        >
                          <option value="python">Python 3</option>
                          <option value="javascript">JavaScript</option>
                          <option value="cpp">C++</option>
                          <option value="java">Java 17</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleRun}
                          disabled={running || submitting}
                          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition disabled:opacity-50"
                        >
                          <Play size={14} className="text-cyan-400" />
                          {running ? "Executing..." : "Run Test"}
                        </button>

                        <button
                          onClick={handleSubmit}
                          disabled={running || submitting}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:opacity-90 transition disabled:opacity-50"
                        >
                          <Send size={14} />
                          {submitting ? "Evaluating..." : "Submit Solution"}
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      rows={14}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-sm text-cyan-200 outline-none focus:border-cyan-400 transition resize-none"
                      placeholder="// Write code here..."
                      spellCheck={false}
                    />

                    {/* Console & Result Display */}
                    <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-xs text-slate-300 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 pb-2">
                        <span>Console Output / Judge Result</span>
                        {lastResult && (
                          <span className={lastResult.verdict === "Accepted" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                            Verdict: {lastResult.verdict}
                          </span>
                        )}
                      </div>

                      <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap text-emerald-400 font-mono">
                        {output || "Run test or submit to see console evaluation details..."}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Tab 3: Submission History (Persisted in PostgreSQL) */}
                {activeTab === "history" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Your Problem Submission History ({submissions.length})
                    </h3>

                    {submissions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">
                        No submissions recorded yet for this account. Submit a solution to see your result history!
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-slate-950 overflow-hidden">
                        {submissions.map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition">
                            <div className="flex items-center gap-3">
                              {sub.verdict === "Accepted" ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
                              )}

                              <div>
                                <p className="font-bold text-white text-sm">
                                  Submission #{sub.id} · <span className="text-cyan-400">{sub.language}</span>
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Passed {sub.passed_tests}/{sub.total_tests} test cases · {sub.execution_time} ms
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                  sub.verdict === "Accepted"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-rose-500/20 text-rose-300"
                                }`}
                              >
                                {sub.verdict}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center text-slate-400">
                Select a problem from the list to begin practicing.
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
