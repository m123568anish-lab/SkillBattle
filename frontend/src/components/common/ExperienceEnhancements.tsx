"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, ExternalLink, HelpCircle, Mail, Moon, Sun, X } from "lucide-react";

const CONSENT_KEY = "skillbattle-cookie-consent";
const THEME_KEY = "skillbattle-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => { const stored = localStorage.getItem(THEME_KEY); if (stored === "light" || stored === "dark") setTheme(stored); }, []);
  function toggle() { const next = theme === "dark" ? "light" : "dark"; setTheme(next); localStorage.setItem(THEME_KEY, next); document.documentElement.dataset.theme = next; document.documentElement.classList.toggle("dark", next === "dark"); }
  return <button type="button" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button>;
}

export function CookieConsent() {
  const [choice, setChoice] = useState<string | null>(null);
  useEffect(() => setChoice(localStorage.getItem(CONSENT_KEY)), []);
  if (choice) return null;
  const save = (value: "necessary" | "all") => { localStorage.setItem(CONSENT_KEY, value); setChoice(value); };
  return <section role="dialog" aria-label="Cookie preferences" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl rounded-2xl border border-white/10 bg-slate-950 p-4 shadow-2xl sm:bottom-5"><p className="text-sm font-semibold text-white">Privacy choices</p><p className="mt-1 text-xs leading-5 text-slate-300">We use essential storage to keep this experience working. Optional analytics remain disabled unless you allow them.</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => save("necessary")} className="min-h-10 rounded-xl border border-white/15 px-3 text-sm text-white">Essential only</button><button onClick={() => save("all")} className="min-h-10 rounded-xl bg-cyan-400 px-3 text-sm font-bold text-slate-950">Allow optional</button><Link href="/privacy" className="min-h-10 px-2 py-2 text-sm text-cyan-300 underline">Privacy</Link></div></section>;
}

function SupportControl() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !open) return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return <>
    {open && <section id="support-options" role="dialog" aria-label="Support options" className="fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom))] left-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur lg:bottom-20">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-white">Need a hand?</p><p className="mt-1 text-xs leading-5 text-slate-300">Browse guidance first, or email support when you need help with your account.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close support options" className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"><X size={16} /></button></div>
      <div className="mt-4 grid gap-2"><Link href="/support" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-between rounded-xl bg-cyan-400 px-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">Open support center <ExternalLink size={16} aria-hidden="true" /></Link><a href="mailto:support@skillbattle.app?subject=SkillBattle%20support" className="flex min-h-11 items-center justify-between rounded-xl border border-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">Email support <Mail size={16} aria-hidden="true" /></a></div>
    </section>}
    <button ref={triggerRef} type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls="support-options" aria-label={open ? "Close support options" : "Open support options"} className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/30 bg-slate-900 text-cyan-200 shadow-xl transition hover:bg-slate-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 lg:bottom-6">{open ? <X size={18} aria-hidden="true" /> : <HelpCircle size={18} aria-hidden="true" />}</button>
  </>;
}

export function PageEnhancements() {
  const [showTop, setShowTop] = useState(false); const [progress, setProgress] = useState(0); const [longPage, setLongPage] = useState(false);
  useEffect(() => {
    const update = () => { const root = document.documentElement; const max = root.scrollHeight - window.innerHeight; setLongPage(max > window.innerHeight * 0.75); setShowTop(window.scrollY > 480); setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0); };
    const utm = new URLSearchParams(window.location.search); const kept = [...utm.entries()].filter(([key]) => key.startsWith("utm_") || key === "ref").filter(([, value]) => value.length <= 120); if (kept.length) sessionStorage.setItem("skillbattle-attribution", JSON.stringify(Object.fromEntries(kept)));
    update(); window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update); return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  return <>{longPage && <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[80] h-0.5 bg-transparent"><div className="h-full bg-cyan-400 transition-[width] duration-100" style={{ width: `${progress}%` }}/></div>}{showTop && <button type="button" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} className="fixed bottom-24 right-4 z-40 rounded-full border border-white/15 bg-slate-900 p-3 text-cyan-300 shadow-xl transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 lg:bottom-6"><ArrowUp size={18}/></button>}<SupportControl /></>;
}
