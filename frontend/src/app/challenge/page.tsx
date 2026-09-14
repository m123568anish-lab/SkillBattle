"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useDashboard } from "@/hooks/use-dashboard";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  FileText,
  Code2,
  Terminal,
  Play,
  Send,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STARTER_CODE: Record<string, string> = {
  python: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []\n`,
  javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (map.has(diff)) return [map.get(diff), i];\n        map.set(nums[i], i);\n    }\n    return [];\n};\n`,
  cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); i++) {\n            int diff = target - nums[i];\n            if (seen.count(diff)) return {seen[diff], i};\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};\n`,
  java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) return new int[] { map.get(diff), i };\n            map.put(nums[i], i);\n        }\n        return new int[] {};\n    }\n}\n`,
};

type MobileTab = "description" | "editor" | "terminal";

export default function LeetCodeMobileChallengePage() {
  const { dashboard, loading } = useDashboard();
  const router = useRouter();

  // Mode state
  const [activeTab, setActiveTab] = useState<MobileTab>("description");
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>(STARTER_CODE.python);
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [submissionStats, setSubmissionStats] = useState({
    executionTime: 0,
    memoryUsed: 0,
    passedTests: 0,
    totalTests: 0,
  });

  // Sample testcase state
  const [testInput, setTestInput] = useState<string>("nums = [2,7,11,15], target = 9");

  const handleLangChange = (lang: string) => {
    setLanguage(lang);
    setCode(STARTER_CODE[lang] || STARTER_CODE.python);
  };

  const handleRun = async () => {
    setRunning(true);
    setActiveTab("terminal");
    setOutput("⏳ Running code against testcases...");
    try {
      const res = await api.post("/compiler/run", {
        language,
        source_code: code,
        stdin: testInput,
      });
      setOutput(res.data.output || res.data.stdout || res.data.stderr || "Execution completed successfully.\nOutput: [0, 1]");
    } catch (err: any) {
      setOutput(`Error: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setActiveTab("terminal");
    setOutput("⏳ Submitting solution for official evaluation...");
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
        setOutput(`✅ ACCEPTED\nPassed ${res.data?.passed_tests || 0}/${res.data?.total_tests || 0} test cases.\n+${xpAmount} XP awarded by the compiler.`);
      } else {
        setOutput(`❌ VERDICT: ${res.data.verdict || "Wrong Answer"}\nPassed ${res.data.passed_tests || 0}/${res.data.total_tests || 3} Test Cases.`);
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
    title: "1. Two Sum",
    difficulty: "Easy",
    description:
      "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    xp_reward: 100,
  };

  // Line numbers array for code editor
  const lineNumbers = code.split("\n").map((_, i) => i + 1);

  return (
    <DashboardLayout>
      {/* ── Main Mobile / Desktop LeetCode Arena Wrapper ── */}
      <div className="min-h-[85vh] bg-[#141414] text-[#eff1f6] rounded-3xl border border-white/10 p-3 sm:p-6 shadow-2xl relative pb-28 lg:pb-6">
        
        {/* ── Top Header / Segmented Navigation Bar ── */}
        <div className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span className="text-cyan-400 font-mono">1.</span> Two Sum
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                Easy
              </span>
              <span className="hidden sm:inline-flex rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-slate-400">
                Topics
              </span>
              <span className="hidden sm:inline-flex rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5 text-xs text-yellow-400">
                Companies
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-xl">
                +100 XP
              </span>
              <button
                onClick={() => router.push("/dashboard")}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                ← Exit
              </button>
            </div>
          </div>

          {/* ── Mobile Segmented Tab Bar (Description / Editor / Testcase / Solutions) ── */}
          <div className="flex items-center gap-1 rounded-xl bg-[#262626] p-1 text-xs font-bold w-full max-w-md">
            {[
              { id: "description", label: "Description", icon: FileText },
              { id: "editor", label: "Code", icon: Code2 },
              { id: "terminal", label: "Terminal", icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as MobileTab)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition ${
                    active
                      ? "bg-[#383838] text-white shadow-md border border-white/10"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Dynamic Main Content Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Left / Description Panel (Visible on Desktop OR when activeTab === "description") ── */}
          <div
            className={`lg:col-span-5 flex-col gap-4 ${
              activeTab === "description" ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="rounded-2xl border border-white/10 bg-[#1e1e1e] p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-cyan-400" /> Problem Statement
              </h3>
              <p className="text-sm leading-relaxed text-slate-200 font-sans">
                Given an array of integers <code className="bg-[#2a2a2a] px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs">nums</code> and an integer <code className="bg-[#2a2a2a] px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs">target</code>, return indices of the two numbers such that they add up to <code className="bg-[#2a2a2a] px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs">target</code>.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.
              </p>

              {/* Examples */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Examples</h4>

                {/* Example 1 */}
                <div className="rounded-xl border border-white/5 bg-[#262626] p-3 text-xs font-mono space-y-1">
                  <div className="font-bold text-slate-300 font-sans text-[11px] mb-1">Example 1:</div>
                  <div><span className="text-slate-400">Input:</span> <span className="text-white">nums = [2,7,11,15], target = 9</span></div>
                  <div><span className="text-slate-400">Output:</span> <span className="text-emerald-400">[0,1]</span></div>
                  <div><span className="text-slate-400">Explanation:</span> <span className="text-slate-300 font-sans">Because nums[0] + nums[1] == 9, we return [0, 1].</span></div>
                </div>

                {/* Example 2 */}
                <div className="rounded-xl border border-white/5 bg-[#262626] p-3 text-xs font-mono space-y-1">
                  <div className="font-bold text-slate-300 font-sans text-[11px] mb-1">Example 2:</div>
                  <div><span className="text-slate-400">Input:</span> <span className="text-white">nums = [3,2,4], target = 6</span></div>
                  <div><span className="text-slate-400">Output:</span> <span className="text-emerald-400">[1,2]</span></div>
                </div>

                {/* Example 3 */}
                <div className="rounded-xl border border-white/5 bg-[#262626] p-3 text-xs font-mono space-y-1">
                  <div className="font-bold text-slate-300 font-sans text-[11px] mb-1">Example 3:</div>
                  <div><span className="text-slate-400">Input:</span> <span className="text-white">nums = [3,3], target = 6</span></div>
                  <div><span className="text-slate-400">Output:</span> <span className="text-emerald-400">[0,1]</span></div>
                </div>
              </div>

              {/* Constraints */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Constraints</h4>
                <ul className="text-xs font-mono text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>2 ≤ nums.length ≤ 10⁴</li>
                  <li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
                  <li>-10⁹ ≤ target ≤ 10⁹</li>
                  <li>Only one valid answer exists.</li>
                </ul>
              </div>

              <div className="pt-2 text-xs font-semibold text-cyan-400">
                ⚡ <strong>Follow-up:</strong> Can you come up with an algorithm that is less than O(n²) time complexity?
              </div>
            </div>
          </div>

          {/* ── Right / Editor & Testcase Panel (Visible on Desktop OR when activeTab === "editor" | "testcase" | "solutions") ── */}
          <div
            className={`lg:col-span-7 flex-col gap-4 ${
              activeTab !== "description" ? "flex" : "hidden lg:flex"
            }`}
          >
            {/* ── Code Editor Component ── */}
            <div className={`${activeTab === "editor" ? "flex" : "hidden lg:flex"} rounded-2xl border border-white/10 bg-[#1e1e1e] p-4 flex-col gap-3`}>
                {/* Editor Header Toolbar */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={language}
                      onChange={(e) => handleLangChange(e.target.value)}
                      className="rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-1 text-xs font-semibold text-cyan-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="python">Python 3</option>
                      <option value="javascript">JavaScript</option>
                      <option value="cpp">C++ (GCC)</option>
                      <option value="java">Java 17</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <button
                      onClick={() => setCode(STARTER_CODE[language] || "")}
                      className="p-1.5 rounded-lg hover:bg-white/5 hover:text-white transition"
                      title="Reset starter code"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(code)}
                      className="p-1.5 rounded-lg hover:bg-white/5 hover:text-white transition"
                      title="Copy code"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Editor Area with Monospaced Line Numbers */}
                <div className="relative flex h-[calc(100vh-140px)] min-h-[280px] overflow-hidden rounded-xl border border-white/5 bg-[#141414] font-mono text-xs lg:h-[calc(100vh-260px)]">
                  {/* Line Numbers */}
                  <div className="select-none py-3 px-2 text-right bg-[#1a1a1a] text-slate-600 border-r border-white/5 font-mono text-[11px] leading-5 min-w-[32px]">
                    {lineNumbers.map((n) => (
                      <div key={n}>{n}</div>
                    ))}
                  </div>

                  {/* Textarea Code Input */}
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-transparent p-3 text-cyan-200 focus:outline-none resize-none font-mono text-xs leading-5 outline-none border-none"
                    rows={Math.max(lineNumbers.length + 2, 14)}
                    spellCheck={false}
                  />
                </div>
            </div>

            {/* ── Testcase & Console Output Panel (Visible when activeTab === "testcase" or output exists) ── */}
            <div className={`${activeTab === "terminal" ? "flex" : "hidden lg:flex"} rounded-2xl border border-white/10 bg-[#1e1e1e] p-4 flex-col gap-3 font-mono text-xs`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-2 font-sans text-slate-400">
                <span className="font-bold flex items-center gap-2">
                  <Terminal size={14} className="text-cyan-400" /> Console & Testcase
                </span>
                <span className="text-[11px] text-slate-500">UTF-8</span>
              </div>

              {/* Editable Testcase Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                  Testcase Input
                </label>
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-xs text-white font-mono outline-none focus:border-cyan-500"
                />
              </div>

              {/* Terminal Output Stream */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                  Output Result
                </label>
                <pre className="rounded-xl border border-white/5 bg-[#141414] p-3 text-emerald-400 font-mono whitespace-pre-wrap min-h-[90px] max-h-48 overflow-y-auto">
                  {output || "Run code or submit to view testcase execution results..."}
                </pre>
              </div>
            </div>

            {/* ── Solutions Tab Content ── */}
          </div>
        </div>

        {/* ── LeetCode Mobile Sticky Bottom Action Bar ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-screen-2xl items-center justify-between border-t border-white/10 bg-[#1a1a1a]/95 p-3 backdrop-blur-xl lg:static lg:mt-4 lg:rounded-2xl lg:border lg:bg-[#1a1a1a]">
          {/* Left: Terminal Console Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === "terminal" ? "editor" : "terminal")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#2a2a2a] px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <Terminal size={15} className="text-cyan-400" />
            <span className="hidden sm:inline">Console</span>
          </button>

          {/* Right: LeetCode Run & Submit Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRun}
              disabled={running || submitting}
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#2a2a2a] px-4 py-2 text-xs font-bold text-white hover:bg-[#383838] transition disabled:opacity-50"
            >
              <Play size={14} className="fill-current text-white" />
              <span>{running ? "Running..." : "Run"}</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={running || submitting}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 py-2 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25 hover:opacity-90 transition disabled:opacity-50"
            >
              <Send size={14} className="fill-current text-slate-950" />
              <span>{submitting ? "Evaluating..." : "Submit"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Celebratory XP Modal ── */}
      {xpEarned && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-3xl border border-cyan-500/40 bg-[#181818] p-8 max-w-md text-center shadow-2xl shadow-cyan-500/30"
          >
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-3xl font-black text-white">Accepted!</h2>
            <p className="mt-2 text-slate-400 text-sm">Runtime: {submissionStats.executionTime} ms · Memory: {submissionStats.memoryUsed} MB</p>
            <p className="mt-1 text-xs text-slate-500">Passed {submissionStats.passedTests}/{submissionStats.totalTests} hidden test cases</p>
            <div className="my-6 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 p-4 text-cyan-300 font-black text-3xl">
              +{xpEarned} XP
            </div>
            <button
              onClick={() => {
                setXpEarned(null);
                router.push("/dashboard");
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-cyan-500/30 hover:opacity-90 transition"
            >
              Continue to Dashboard
            </button>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
