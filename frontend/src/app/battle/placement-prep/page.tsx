"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import API_ENDPOINTS from "@/lib/api-constants";

export default function PlacementPrepPage() {
  const params = useSearchParams();
  const [steps, setSteps] = useState<string[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  useEffect(() => { api.get(API_ENDPOINTS.MATCHMAKING.PLACEMENT_PREP).then(({ data }) => { setSteps(data.steps.map((step: { id: string }) => step.id)); setDone(data.session?.completed_steps || []); }); }, []);
  async function toggle(step: string) { const next = done.includes(step) ? done.filter((item) => item !== step) : [...done, step]; setDone(next); setSaved(false); await api.post(API_ENDPOINTS.MATCHMAKING.PLACEMENT_PREP, { match_id: params.get("room"), completed_steps: next, status: next.length === steps.length ? "ready" : "in_progress" }); setSaved(true); }
  return <main className="min-h-screen bg-slate-950 px-6 py-16 text-white"><div className="mx-auto max-w-2xl"><p className="text-sm uppercase tracking-[.3em] text-violet-300">Placement Prep</p><h1 className="mt-3 text-4xl font-bold">Get battle-ready</h1><p className="mt-3 text-slate-400">Complete these quick steps before entering your 1v1.</p><div className="mt-8 space-y-3">{steps.map((step) => <button key={step} onClick={() => toggle(step)} className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left ${done.includes(step) ? "border-emerald-400 bg-emerald-400/10" : "border-white/10 bg-slate-900/70"}`}><span className="capitalize">{step.replace("-", " ")}</span><span>{done.includes(step) ? "✓" : "○"}</span></button>)}</div>{saved && <p className="mt-5 text-sm text-emerald-300">Progress saved.</p>}<button disabled={done.length !== steps.length} className="mt-8 w-full rounded-2xl bg-cyan-400 px-5 py-4 font-semibold text-slate-950 disabled:opacity-40">Ready up</button></div></main>;
}
