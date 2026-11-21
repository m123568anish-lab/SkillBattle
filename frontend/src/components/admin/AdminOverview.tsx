"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Database, RefreshCw, Server, TriangleAlert, Users, Zap } from "lucide-react";
import api from "@/services/api";
import PlacementIntelligencePanel from "./PlacementIntelligencePanel";

type Health = {
  api: string;
  database: string;
  migration_version: string | null;
  total_users: number | null;
  active_users: number | null;
  assessment_attempts: number | null;
  active_battles: number | null;
  completed_battles: number | null;
  ai_providers: Record<string, boolean>;
  websocket: string;
  failed_jobs: number | null;
  notification_queue: string;
};

function statusTone(value: string | null | undefined) {
  const normalized = (value || "").toLowerCase();
  if (["healthy", "initialized", "configured"].includes(normalized)) return "good";
  if (!value || normalized === "unavailable" || normalized === "not configured" || normalized === "not_configured") return "muted";
  return "warn";
}

function StatusBadge({ value }: { value: string | null | undefined }) {
  const tone = statusTone(value);
  const Icon = tone === "good" ? CheckCircle2 : tone === "warn" ? TriangleAlert : Activity;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone === "good" ? "bg-emerald-400/10 text-emerald-300" : tone === "warn" ? "bg-amber-300/10 text-amber-200" : "bg-white/[0.06] text-slate-400"}`}><Icon className="h-3.5 w-3.5" />{value || "Unavailable"}</span>;
}

function Kpi({ label, value, icon: Icon, note }: { label: string; value: number | null; icon: typeof Users; note: string }) {
  return <article className="rounded-2xl border border-white/[0.08] bg-[#101720] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.16)]"><div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300"><Icon className="h-4 w-4" /></span><span className="text-[10px] uppercase tracking-[0.16em] text-slate-600">live</span></div><p className="mt-5 text-3xl font-semibold tracking-tight text-white">{value === null ? "—" : value.toLocaleString()}</p><p className="mt-1 text-sm font-medium text-slate-300">{label}</p><p className="mt-2 text-xs text-slate-500">{note}</p></article>;
}

export default function AdminOverview() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try { setHealth((await api.get<Health>("/admin/system-health")).data); setError(null); }
    catch { setError("The command center could not load its live health snapshot."); }
    finally { setRefreshing(false); }
  }

  useEffect(() => { void refresh(); }, []);

  return <div className="space-y-6">
    <section className="rounded-2xl border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,rgba(163,230,53,0.11),transparent_36%),#101720] p-6 sm:p-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-start"><div><p className="text-sm text-slate-400">Operational snapshot</p><h3 className="mt-2 text-2xl font-semibold text-white">Know what needs attention.</h3><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Metrics below come from the protected system-health endpoint. Unavailable values remain unavailable rather than being represented as zero.</p></div><button type="button" onClick={() => void refresh()} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/[0.08] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh data</button></div></section>
    {error && <div role="alert" className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100">{error}</div>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi label="Registered users" value={health?.total_users ?? null} icon={Users} note="Users table count" />
      <Kpi label="Active users" value={health?.active_users ?? null} icon={Activity} note="is_active = true" />
      <Kpi label="Assessment attempts" value={health?.assessment_attempts ?? null} icon={Zap} note="Recorded attempts" />
      <Kpi label="Active battles" value={health?.active_battles ?? null} icon={Server} note="Waiting or running" />
      <Kpi label="Completed battles" value={health?.completed_battles ?? null} icon={CheckCircle2} note="Completed rooms" />
    </section>
    <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"><article className="rounded-2xl border border-white/[0.08] bg-[#101720] p-5"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold text-white">Runtime readiness</h3><p className="mt-1 text-xs text-slate-500">Connectivity and recorded state are shown separately.</p></div><Database className="h-5 w-5 text-slate-500" /></div><div className="grid gap-3 sm:grid-cols-2"><Runtime label="API" value={health?.api} /><Runtime label="Database" value={health?.database} /><Runtime label="WebSocket" value={health?.websocket} /><Runtime label="Migration record" value={health?.migration_version || "Not recorded"} /></div></article><article className="rounded-2xl border border-white/[0.08] bg-[#101720] p-5"><h3 className="font-semibold text-white">Integrations</h3><p className="mt-1 text-xs text-slate-500">Configuration presence only; secrets are never exposed.</p><div className="mt-5 space-y-3">{Object.entries(health?.ai_providers || {}).map(([name, configured]) => <div key={name} className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-sm"><span className="capitalize text-slate-300">{name}</span><StatusBadge value={configured ? "configured" : "not configured"} /></div>)}{!health && <p className="text-sm text-slate-500">Loading integration state…</p>}</div></article></section>
    <PlacementIntelligencePanel />
    <section className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] p-5"><div className="flex items-start gap-3"><TriangleAlert className="mt-0.5 h-4 w-4 text-amber-300" /><div><h3 className="text-sm font-semibold text-white">Historical trends are not connected</h3><p className="mt-1 text-sm leading-6 text-slate-400">The current backend exposes point-in-time admin metrics, not date-filtered activity series. No synthetic charts are shown until a historical analytics contract is available.</p></div></div></section>
  </div>;
}

function Runtime({ label, value }: { label: string; value: string | null | undefined }) { return <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3"><span className="text-sm text-slate-300">{label}</span><StatusBadge value={value} /></div>; }
