"use client";

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Code2, RotateCcw, ZoomIn, ZoomOut, Check, Sparkles } from "lucide-react";
import { useTheme } from "@/components/common/ThemeProvider";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[300px] items-center justify-center bg-[#0D1117] font-mono text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        <span>Loading Editor Engine...</span>
      </div>
    </div>
  ),
});

export interface AssessmentCodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language: string;
  onLanguageChange?: (lang: string) => void;
  availableLanguages?: string[];
  draftKey?: string;
  onReset?: () => void;
  readOnly?: boolean;
  className?: string;
}

const TOUCH_SYMBOLS = [
  { label: "{", insert: "{" },
  { label: "}", insert: "}" },
  { label: "[", insert: "[" },
  { label: "]", insert: "]" },
  { label: "(", insert: "(" },
  { label: ")", insert: ")" },
  { label: ":", insert: ":" },
  { label: ";", insert: ";" },
  { label: "Tab", insert: "    " },
  { label: '"', insert: '"' },
  { label: "'", insert: "'" },
  { label: "=", insert: " = " },
];

export function AssessmentCodeEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  availableLanguages = ["python", "javascript", "cpp", "java"],
  draftKey,
  onReset,
  readOnly = false,
  className = "",
}: AssessmentCodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<any>(null);
  const [fontSize, setFontSize] = useState(13);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  // Draft auto-save to localStorage
  useEffect(() => {
    if (!draftKey || !value) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`skillbattle_draft_${draftKey}`, value);
        setSaveStatus("saved");
        const clearSaved = setTimeout(() => setSaveStatus("idle"), 2000);
        return () => clearTimeout(clearSaved);
      } catch {
        // quota exceeded or storage disabled
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [value, draftKey]);

  // Execute edits using Monaco API for cursor-preserving insertions
  const insertToken = (token: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    if (!selection) return;

    editor.executeEdits("touch-utility-bar", [
      {
        range: selection,
        text: token,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const monacoLanguage = language === "cpp" ? "cpp" : language === "javascript" ? "javascript" : language;

  return (
    <div className={`flex flex-col h-full bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl overflow-hidden ${className}`}>
      {/* Top Editor Toolbar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border-default)] bg-[var(--surface-elevated)] px-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-cyan-400" />
          {onLanguageChange ? (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              disabled={readOnly}
              className="rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] outline-none transition hover:border-[var(--accent-strong)] focus:border-[var(--accent-strong)]"
            >
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang} className="bg-[var(--surface-card)] text-[var(--text-primary)]">
                  {lang === "cpp" ? "C++" : lang === "javascript" ? "JavaScript" : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-mono font-semibold text-slate-300">
              {language.toUpperCase()}
            </span>
          )}

          {draftKey && saveStatus === "saved" && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400/80">
              <Check className="h-3 w-3" /> Draft saved
            </span>
          )}
        </div>

        {/* Font size & Reset buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-1 py-0.5">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(11, s - 1))}
              title="Decrease Font Size"
              className="p-1 text-slate-400 hover:text-white"
            >
              <ZoomOut className="h-3 w-3" />
            </button>
            <span className="text-[10px] font-mono text-slate-300 w-4 text-center">{fontSize}</span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(20, s + 1))}
              title="Increase Font Size"
              className="p-1 text-slate-400 hover:text-white"
            >
              <ZoomIn className="h-3 w-3" />
            </button>
          </div>

          {onReset && !readOnly && (
            <button
              type="button"
              onClick={onReset}
              title="Reset to starter template"
              className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Touch Utility Bar */}
      {!readOnly && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border-default)] bg-[var(--surface-elevated)] px-2 py-1.5">
          <span className="text-[10px] font-mono text-slate-500 mr-1 select-none flex items-center gap-0.5 shrink-0">
            <Sparkles className="h-2.5 w-2.5 text-cyan-400" /> Quick
          </span>
          {TOUCH_SYMBOLS.map((sym) => (
            <button
              key={sym.label}
              type="button"
              onClick={() => insertToken(sym.insert)}
              className="flex min-h-[30px] min-w-[32px] shrink-0 items-center justify-center rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-2 text-xs font-mono font-medium text-[var(--text-secondary)] transition active:scale-95 active:bg-[var(--accent)]/20 hover:bg-[var(--surface-subtle)]"
            >
              {sym.label}
            </button>
          ))}
        </div>
      )}

      {/* Editor Body */}
      <div className="relative flex-1 min-h-[280px] w-full overflow-hidden">
        <MonacoEditor
          height="100%"
          language={monacoLanguage}
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          value={value}
          onChange={(val) => onChange(val || "")}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            fontSize,
            lineNumbers: "on",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            cursorBlinking: "smooth",
            smoothScrolling: true,
            padding: { top: 8, bottom: 8 },
            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
          }}
        />
      </div>
    </div>
  );
}
