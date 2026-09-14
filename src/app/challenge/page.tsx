"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useDashboard } from "@/hooks/use-dashboard";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Code2, FileText, Terminal } from "lucide-react";

const STARTER_CODE: Record<string, string> = {
  python: `def solve_challenge(input_data):\n    # Write your solution here\n    return input_data\n\n# Example Test\nprint(solve_challenge("Hello SkillBattle"))\n`,
  javascript: `function solveChallenge(inputData) {\n    // Write your solution here\n    return inputData;\n}\n\nconsole.log(solveChallenge("Hello SkillBattle"));\n`,
  cpp: `#include <iostream>\n#include <string>\n\nusing namespace std;\n\nint main() {\n    cout << "Hello SkillBattle" << endl;\n    return 0;\n}\n`,
  java: `public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello SkillBattle");\n    }\n}\n`,
};

export default function DailyChallengePage() {
  const { dashboard, loading } = useDashboard();
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>(STARTER_CODE.python);
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "editor" | "terminal">("description");
  const [submissionStats, setSubmissionStats] = useState({ executionTime: 0, memoryUsed: 0, passedTests: 0, totalTests: 0 });
  const router = useRouter();

  const handleLangChange = (lang: string) => {
    setLanguage(lang);
    setCode(STARTER_CODE[lang] || "");
  };

  const handleRun = async () => {
    setRunning(true);
    setActiveTab("terminal");
    setOutput("Executing code against sample inputs...");
    try {
      const res = await api.post("/compiler/run", {
        language,
        source_code: code,
        stdin: "Sample Input Data",
      });
      setOutput(res.data.output || res.data.stdout || res.data.stderr || "Execution completed cleanly.");
    } catch (err: any) {
      setOutput(`Error running code: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setActiveTab("terminal");
    setOutput("Submitting code for official evaluation...");
    try {
      const challengeId = dashboard?.daily_challenge?.id || "1";
      const res = await api.post("/compiler/submit", {
        problem_id: parseInt(challengeId) || 1,
        language,
        source_code: code,
      });

      const passed = Boolean(res.data?.verdict === "Accepted" || (res.data?.passed_tests ?? 0) > 0);
      setSubmissionStats({
        executionTime: res.data?.execution_time || 0,
        memoryUsed: res.data?.memory_used || 0,
        passedTests: res.data?.passed_tests || 0,
        totalTests: res.data?.total_tests || 0,
      });

      if (passed) {
        const xpAmount = res.data?.xp_earned || dashboard?.daily_challenge?.xp_reward || 100;
        setXpEarned(xpAmount);
        setOutput(`✅ VERDICT: ACCEPTED!\nPassed ${res.data.passed_tests || 1}/${res.data.total_tests || 1} Test Cases.\n🎉 +${xpAmount} XP Awarded!`);
      } else {
        setOutput(`❌ VERDICT: ${res.data.verdict || "Wrong Answer"}\nPassed ${res.data.passed_tests || 0}/${res.data.total_tests || 1} Test Cases.`);
      }
    } catch (err: any) {
      setOutput(`❌ Submission failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[70vh] items-center justify-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const challenge = dashboard?.daily_challenge || {
    title: "Daily Coding Challenge",
    difficulty: "Medium",
    description: "Solve today's coding puzzle to increase your rating and maintain your streak.",
    xp_reward: 50,
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
              ⚡ Daily Mission
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              {challenge.difficulty}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
            {challenge.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-bold text-yellow-300">
            ⭐ +{challenge.xp_reward} XP
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            ← Exit
          </button>
        </div>
      </div>

      <div className="mb-4 flex w-full items-center gap-1 rounded-xl border border-white/10 bg-slate-900 p-1 md:hidden">
        {[
          { id: "description", label: "Description", icon: FileText },
          { id: "editor", label: "Code Editor", icon: Code2 },
          { id: "terminal", label: "Terminal / Run", icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-bold ${activeTab === tab.id ? "bg-cyan-500/15 text-cyan-300" : "text-slate-500"}`}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <aside className={`${activeTab === "description" ? "block" : "hidden md:block"} rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.7)] backdrop-blur-xl md:col-span-5`}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Problem Statement</h2>
            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">
              {challenge.difficulty}
            </span>
          </div>

          <p className="text-sm leading-7 text-slate-300">
            {challenge.description}
          </p>

          <div className="mt-6 rounded-2xl border border-white/5 bg-slate-800/50 p-4">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Constraints</h3>
            <ul className="space-y-2 text-xs text-slate-200">
              <li>• 1 ≤ N ≤ 10^5</li>
              <li>• Time Limit: 2.0s</li>
              <li>• Memory Limit: 256 MB</li>
            </ul>
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs leading-6 text-cyan-200">
            💡 <strong>Pro Tip:</strong> Submit a correct solution to claim the daily streak bonus and keep your rating climbing.
          </div>
        </aside>

        <section className={`${activeTab === "description" ? "hidden md:flex" : "flex"} flex-col gap-4 md:col-span-7`}>
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-[0_16px_60px_rgba(15,23,42,0.75)] backdrop-blur-xl">
            <div className="mb-3 flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Language</label>
                <select
                  value={language}
                  onChange={(e) => handleLangChange(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs font-medium text-white outline-none transition focus:border-cyan-500"
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
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {running ? "Executing..." : "▶ Run Code"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={running || submitting}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Evaluating..." : "🚀 Submit"}
                </button>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${activeTab === "editor" ? "block" : "hidden md:block"} h-[calc(100vh-140px)] w-full resize-none rounded-2xl border border-white/5 bg-slate-950/90 p-4 font-mono text-sm text-cyan-200 outline-none transition focus:border-cyan-500/50 md:h-[420px] focus:border-cyan-500/50`}
              placeholder="// Write your algorithm solution here..."
              spellCheck={false}
            />
          </div>

          <div className={`${activeTab === "terminal" ? "block" : "hidden md:block"} rounded-3xl border border-white/10 bg-slate-950/80 p-4 font-mono text-xs text-slate-300 shadow-inner shadow-slate-950/80`}>
            <div className="mb-2 flex items-center justify-between border-b border-white/5 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              <span>Console</span>
              <span>UTF-8</span>
            </div>
            <pre className="max-h-44 min-h-[90px] overflow-y-auto whitespace-pre-wrap text-emerald-400">
              {output || "Output will appear here after running or submitting..."}
            </pre>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-slate-500">
              <span>Passed: {submissionStats.passedTests}/{submissionStats.totalTests}</span>
              <span>Time: {submissionStats.executionTime} ms</span>
              <span>Memory: {submissionStats.memoryUsed} MB</span>
            </div>
          </div>
        </section>
      </div>

      {/* Celebratory XP Modal */}
      {xpEarned && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="rounded-3xl border border-cyan-500/40 bg-slate-900 p-8 max-w-md text-center shadow-2xl shadow-cyan-500/30 transform animate-bounce">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-black text-white">Challenge Completed!</h2>
            <p className="mt-2 text-slate-400">You've successfully solved today's daily mission!</p>
            <div className="my-6 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 p-4 text-cyan-300 font-extrabold text-2xl">
              +{xpEarned} XP Earned
            </div>
            <button
              onClick={() => {
                setXpEarned(null);
                router.push("/dashboard");
              }}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-cyan-500/30 hover:opacity-90 transition"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
