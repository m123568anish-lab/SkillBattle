"use client";

import Editor from "@monaco-editor/react";
import { Maximize2, Minimize2, Play, RefreshCw, Send, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useTheme } from "@/components/common/ThemeProvider";

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
  const { resolvedTheme } = useTheme();
  const [question, setQuestion] = useState<Question | null>(null);
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState(boilerplate.python);
  const [result, setResult] = useState<string | null>(null);
  const [isAccepted, setIsAccepted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setIsAccepted(null);
    try {
      const response = await api.get<Question>("/api/battle/next-question", {
        baseURL: "",
        params: question ? { exclude_question_id: question.id } : undefined,
      });
      setQuestion(response.data);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Unable to load a question.");
    } finally {
      setLoading(false);
    }
  }, [question]);

  useEffect(() => {
    void loadQuestion();
  }, []);

  const execute = async (submit: boolean) => {
    if (!question) return;
    if (submit) setSubmitting(true);
    else setLoading(true);
    setResult(null);
    setIsAccepted(null);
    try {
      const response = await api.post<{
        accepted: boolean;
        passed_tests: number;
        total_tests: number;
        execution_time_ms: number;
      }>("/api/battle/submit", {
        question_id: question.id,
        language,
        source_code: code,
        submit,
      }, {
        baseURL: "",
      });
      const payload = response.data;
      setIsAccepted(payload.accepted);
      setResult(`${payload.accepted ? "Accepted" : "Not accepted"} · ${payload.passed_tests}/${payload.total_tests} tests · ${payload.execution_time_ms}ms`);
    } catch (error) {
      setIsAccepted(false);
      setResult(error instanceof Error ? error.message : "Execution failed.");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <section className={`${fullscreen ? "fixed inset-3 z-50 shadow-2xl" : ""} min-w-0 overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xl transition-all duration-300`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] p-4 bg-[var(--surface-elevated)]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">Battle Practice Editor</p>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mt-0.5">{question?.title || (loading ? "Loading question..." : "No question available")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={language}
            onChange={(event) => {
              const next = event.target.value as Language;
              setLanguage(next);
              setCode(boilerplate[next]);
            }}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            aria-label="Programming language"
          >
            <option value="python">Python 3</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
          </select>
          <button
            type="button"
            onClick={() => setFullscreen((value) => !value)}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-2 text-[var(--text-secondary)] transition hover:border-[var(--accent)]/50 hover:text-[var(--text-primary)] active:scale-95"
            aria-label="Toggle full screen"
          >
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            type="button"
            onClick={() => void loadQuestion()}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-2 text-[var(--text-secondary)] transition hover:border-[var(--accent)]/50 hover:text-[var(--text-primary)] active:scale-95"
            aria-label="Refresh question"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="grid min-h-[620px] min-w-0 lg:grid-cols-2">
        <article className="min-w-0 overflow-y-auto border-b border-[var(--border-subtle)] p-5 lg:border-b-0 lg:border-r">
          <div className="prose max-w-none text-[var(--text-secondary)] leading-relaxed"><p className="whitespace-pre-wrap">{question?.description || "Select a question to begin."}</p></div>
          <div className="mt-4 flex flex-wrap gap-2">{[...(question?.topic_tags || []), ...(question?.company_tags || [])].map((tag) => <span key={tag} className="rounded-full bg-[var(--surface-elevated)] border border-[var(--border-subtle)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">{tag}</span>)}</div>
          {question?.constraints && (
            <div className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Constraints</h2>
              <p className="mt-2 whitespace-pre-wrap text-xs text-[var(--text-secondary)] font-mono">{question.constraints}</p>
            </div>
          )}
          <div className="mt-6 flex gap-2 border-b border-[var(--border-subtle)] pb-2">
            <button type="button" onClick={() => setShowTests(false)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${!showTests ? "bg-[var(--accent)]/15 text-[var(--accent-strong)] border border-[var(--accent)]/30" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>Examples</button>
            <button type="button" onClick={() => setShowTests(true)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${showTests ? "bg-[var(--accent)]/15 text-[var(--accent-strong)] border border-[var(--accent)]/30" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>Test Cases</button>
          </div>
          <div className="mt-3 space-y-3">
            {question?.examples?.map((example, index) => (
              <div key={`${example.input}-${index}`} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Example {index + 1}</p>
                <pre className="mt-2 overflow-x-auto text-xs font-mono text-[var(--text-secondary)]">Input: {example.input}{"\n"}Output: {example.output}</pre>
              </div>
            ))}
          </div>
          {showTests && <p className="mt-3 text-xs text-[var(--text-muted)]">Hidden test evaluation is verified upon server submission.</p>}
        </article>

        <div className="flex min-w-0 flex-col bg-[var(--surface-card)] transition-[box-shadow] focus-within:shadow-[inset_0_0_0_1px_var(--accent)]">
          <Editor
            height="540px"
            language={language === "javascript" ? "javascript" : language}
            theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{ minimap: { enabled: false }, automaticLayout: true, fontSize: 14, scrollBeyondLastLine: false }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-default)] p-4 bg-[var(--surface-elevated)]">
            <div className="flex items-center gap-2">
              {isAccepted === true && <CheckCircle2 size={16} className="text-emerald-400" />}
              {isAccepted === false && <XCircle size={16} className="text-rose-400" />}
              <span className={`text-xs font-mono font-medium ${isAccepted === true ? "text-emerald-300 font-bold" : isAccepted === false ? "text-rose-300" : "text-[var(--text-secondary)]"}`}>
                {result || "Run public tests before submitting code."}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={loading || submitting}
                onClick={() => void execute(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--surface-subtle)] active:scale-95 disabled:opacity-40"
              >
                {loading ? <Loader2 size={14} className="animate-spin text-current" /> : <Play size={14} />}
                Run Tests
              </button>
              <button
                type="button"
                disabled={loading || submitting}
                onClick={() => void execute(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--text-on-accent)] transition hover:bg-[var(--accent-strong)] hover:shadow-[0_0_16px_rgba(200,239,114,0.3)] active:scale-95 disabled:opacity-40"
              >
                {submitting ? <Loader2 size={14} className="animate-spin text-current" /> : <Send size={14} />}
                Submit Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
