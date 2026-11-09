"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { ArrowUp, Check, ExternalLink, HelpCircle, Laptop, Mail, Moon, Sun, X } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useTheme, type ThemePreference } from "./ThemeProvider";

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  description: string;
  Icon: typeof Sun;
}[] = [
  { value: "light", label: "Light", description: "A warm, bright canvas for daytime.", Icon: Sun },
  { value: "dark", label: "Dark", description: "A low-glare look for focused work.", Icon: Moon },
  { value: "system", label: "System", description: "Match your device setting.", Icon: Laptop },
];

export function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const { preference, resolvedTheme, setPreference } = useTheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const selectedLabel =
    preference === "system"
      ? "System"
      : resolvedTheme === "light"
        ? "Light"
        : "Dark";

  const selectedIcon =
    preference === "system"
      ? Laptop
      : resolvedTheme === "light"
        ? Sun
        : Moon;

  useEffect(() => {
    if (!open) return;
    const selectedIndex = THEME_OPTIONS.findIndex(({ value }) => value === preference);
    optionRefs.current[selectedIndex]?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, preference]);

  async function chooseTheme(next: ThemePreference) {
    setPreference(next);
    setOpen(false);
    triggerRef.current?.focus();
    if (!isAuthenticated) return;
    try {
      await api.put("/profile/preferences", { theme: next });
    } catch {
      toast.error("Theme is applied on this device, but could not be saved to your account.");
    }
  }

  function focusThemeOption(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;
    switch (event.key) {
      case "ArrowDown":
        nextIndex = (index + 1) % THEME_OPTIONS.length;
        break;
      case "ArrowUp":
        nextIndex = (index - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = THEME_OPTIONS.length - 1;
        break;
      case "Tab":
        setOpen(false);
        return;
      default:
        return;
    }

    event.preventDefault();
    optionRefs.current[nextIndex]?.focus();
  }

  const CurrentIcon = selectedIcon;
  const activeModeDescription =
    preference === "system"
      ? `Following your device setting. ${resolvedTheme === "light" ? "Light" : "Dark"} mode is active.`
      : `${resolvedTheme === "light" ? "Light" : "Dark"} mode is active.`;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Theme: ${selectedLabel}${preference === "system" ? `, currently ${resolvedTheme}` : ""}. Change theme preference`}
        title={`${selectedLabel}${preference === "system" ? ` (${resolvedTheme})` : ""} theme`}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-expanded={open}
        className="group inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] shadow-[0_1px_0_rgba(0,0,0,0.12)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <CurrentIcon size={17} aria-hidden="true" className="transition-transform duration-200 group-hover:rotate-12" />
        <span className="sr-only">{selectedLabel} theme</span>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            aria-hidden="true"
            onClick={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}
          />
          <div
            id={menuId}
            role="menu"
            aria-label="Theme preference"
            className="absolute right-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.28)]"
          >
            <div className="px-2.5 pb-2 pt-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Appearance</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{activeModeDescription}</p>
            </div>
            <div className="space-y-0.5">
              {THEME_OPTIONS.map(({ value, label, description, Icon }, index) => {
                const selected = preference === value;
                return (
                  <button
                    key={value}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    type="button"
                    role="menuitemradio"
                    aria-label={label}
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
                    onKeyDown={(event) => focusThemeOption(event, index)}
                    onClick={() => void chooseTheme(value)}
                    className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                      selected
                        ? "bg-[var(--surface-elevated)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      selected
                        ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
                        : "bg-[var(--surface-card)] text-[var(--accent-strong)]"
                    }`}>
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block font-medium">{label}</span>
                      <span className="mt-0.5 block text-xs text-[var(--text-muted)]" aria-hidden="true">{description}</span>
                    </span>
                    {selected && <Check size={16} className="shrink-0 text-[var(--accent-strong)]" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function CookieConsent() {
  return null;
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
    {open && <section id="support-options" role="dialog" aria-label="Support options" className="fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom))] left-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4 text-[var(--text-primary)] shadow-2xl lg:bottom-20">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">Need a hand?</p><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Browse guidance first, or email support when you need help with your account.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close support options" className="rounded-lg p-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"><X size={16} /></button></div>
      <div className="mt-4 grid gap-2"><Link href="/support" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-between rounded-lg bg-[var(--accent)] px-3 text-sm font-bold text-[var(--text-on-accent)] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Open support center <ExternalLink size={16} aria-hidden="true" /></Link><a href="mailto:support@qubira.io?subject=Qubira%20support" className="flex min-h-11 items-center justify-between rounded-lg border border-[var(--border-default)] px-3 text-sm font-semibold transition hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Email support <Mail size={16} aria-hidden="true" /></a></div>
    </section>}
    <button ref={triggerRef} type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls="support-options" aria-label={open ? "Close support options" : "Open support options"} className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--accent-strong)] shadow-xl transition hover:bg-[var(--surface-subtle)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] lg:bottom-6">{open ? <X size={18} aria-hidden="true" /> : <HelpCircle size={18} aria-hidden="true" />}</button>
  </>;
}

export function PageEnhancements() {
  const [showTop, setShowTop] = useState(false); const [progress, setProgress] = useState(0); const [longPage, setLongPage] = useState(false);
  useEffect(() => {
    const update = () => { const root = document.documentElement; const max = root.scrollHeight - window.innerHeight; setLongPage(max > window.innerHeight * 0.75); setShowTop(window.scrollY > 480); setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0); };
    const utm = new URLSearchParams(window.location.search); const kept = [...utm.entries()].filter(([key]) => key.startsWith("utm_") || key === "ref").filter(([, value]) => value.length <= 120); if (kept.length) sessionStorage.setItem("skillbattle-attribution", JSON.stringify(Object.fromEntries(kept)));
    update(); window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update); const handleVis = () => { if (document.hidden) document.body.classList.add("tab-hidden"); else document.body.classList.remove("tab-hidden"); }; document.addEventListener("visibilitychange", handleVis); return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); document.removeEventListener("visibilitychange", handleVis); };
  }, []);
  return <>{longPage && <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[80] h-0.5 bg-transparent"><div className="h-full bg-cyan-400 transition-[width] duration-100" style={{ width: `${progress}%` }}/></div>}{showTop && <button type="button" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} className="fixed bottom-24 right-4 z-40 rounded-full border border-white/15 bg-slate-900 p-3 text-cyan-300 shadow-xl transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 lg:bottom-6"><ArrowUp size={18}/></button>}<SupportControl /></>;
}
