"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) { const [copied, setCopied] = useState(false); const copy = async () => { try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); } }; return <button type="button" onClick={() => void copy()} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-white/10 px-2 text-xs text-slate-200 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400" aria-live="polite">{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? "Copied" : label}</button>; }
