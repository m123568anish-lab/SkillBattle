"use client";

import Editor from "@monaco-editor/react";
import { Maximize2, Minimize2, Play, RefreshCw, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Language = "python" | "cpp" | "java" | "javascript";
type Question = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  constraints: string;
  examples: Array<{ input: string; output: string }>;
  company_tags: string[];
  topic_tags: string[];
};

const boilerplate: Record<Language, string> = {
  python: "def solve():\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    solve()\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n",
  java: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n",
  javascript: "const fs = require('fs');\n\nfunction solve() {\n  // Write your solution here\n}\n\nsolve();\n",
};

export default function BattleArea() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState(boilerplate.python);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [darkEditor, setDarkEditor] = useState(true);
  const apiUrl = useMemo(() => (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, ""), []);

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem("access_token");
      const suffix = question ? `?exclude_question_id=${question.id}` : "";
      const response = await fetch(`${apiUrl}/api/battle/next-question${suffix}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Unable to load a question.");
      setQuestion(await response.json());
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Unable to load a question.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, question]);

  useEffect(() => {
    void loadQuestion();
  }, []);

  const execute = async (submit: boolean) => {
    if (!question) return;
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/api/battle/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ question_id: question.id, language, source_code: code, submit }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || "Execution failed.");
      setResult(`${payload.accepted ? "Accepted" : "Not accepted"} · ${payload.passed_tests}/${payload.total_tests} tests · ${payload.execution_time_ms}ms`);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Execution failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`${fullscreen ? "fixed inset-3 z-50" : ""} min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-xl transition-all duration-300 dark:border-white/10 dark:bg-[#111827] dark:text-white`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-white/10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Battle Area</p>
          <h1 className="text-xl font-black">{question?.title || (loading ? "Loading question..." : "No question available")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={language} onChange={(event) => { const next = event.target.value as Language; setLanguage(next); setCode(boilerplate[next]); }} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" aria-label="Programming language">
            <option value="python">Python 3</option><option value="cpp">C++</option><option value="java">Java</option><option value="javascript">JavaScript</option>
          </select>
          <button type="button" onClick={() => setDarkEditor((value) => !value)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-white/10">{darkEditor ? "Light editor" : "Dark editor"}</button>
          <button type="button" onClick={() => setFullscreen((value) => !value)} className="rounded-lg border border-slate-300 p-2 dark:border-white/10" aria-label="Toggle full screen">{fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
          <button type="button" onClick={() => void loadQuestion()} className="rounded-lg border border-slate-300 p-2 dark:border-white/10" aria-label="Refresh question"><RefreshCw size={16} /></button>
        </div>
      </div>
      <div className="grid min-h-[620px] min-w-0 lg:grid-cols-2">
        <article className="min-w-0 overflow-y-auto border-b border-slate-200 p-5 dark:border-white/10 lg:border-b-0 lg:border-r">
          <div className="prose prose-slate max-w-none dark:prose-invert"><p className="whitespace-pre-wrap">{question?.description || "Select a question to begin."}</p></div>
          <div className="mt-4 flex flex-wrap gap-2">{[...(question?.topic_tags || []), ...(question?.company_tags || [])].map((tag) => <span key={tag} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">{tag}</span>)}</div>
          {question?.constraints && <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-900"><h2 className="font-bold">Constraints</h2><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{question.constraints}</p></div>}
          <div className="mt-6 flex gap-2 border-b border-slate-200 pb-2 dark:border-white/10">
            <button type="button" onClick={() => setShowTests(false)} className={`px-3 py-2 text-sm font-bold ${!showTests ? "border-b-2 border-cyan-500 text-cyan-600" : "text-slate-500"}`}>Examples</button>
            <button type="button" onClick={() => setShowTests(true)} className={`px-3 py-2 text-sm font-bold ${showTests ? "border-b-2 border-cyan-500 text-cyan-600" : "text-slate-500"}`}>Test Cases</button>
          </div>
          <div className="mt-3 space-y-3">{question?.examples?.map((example, index) => <div key={`${example.input}-${index}`} className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><p className="text-xs font-bold uppercase text-slate-500">Example {index + 1}</p><pre className="mt-2 overflow-x-auto text-sm">Input: {example.input}{"\n"}Output: {example.output}</pre></div>)}</div>
          {showTests && <p className="mt-3 text-xs text-slate-500">Hidden tests are only evaluated after submission.</p>}
        </article>
        <div className="flex min-w-0 flex-col bg-slate-950">
          <Editor height="540px" language={language === "javascript" ? "javascript" : language} theme={darkEditor ? "vs-dark" : "light"} value={code} onChange={(value) => setCode(value || "")} options={{ minimap: { enabled: false }, automaticLayout: true, fontSize: 14, scrollBeyondLastLine: false }} />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4"><span className="text-sm text-slate-300">{result || "Run public tests before submitting."}</span><div className="flex gap-2"><button type="button" disabled={loading} onClick={() => void execute(false)} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-bold transition-all duration-300 hover:bg-white/10 disabled:opacity-50"><Play size={15} /> Run Tests</button><button type="button" disabled={loading} onClick={() => void execute(true)} className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition-all duration-300 hover:bg-cyan-400 disabled:opacity-50"><Send size={15} /> Submit Code</button></div></div>
        </div>
      </div>
    </section>
  );
}
