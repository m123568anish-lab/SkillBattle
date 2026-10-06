"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, LockKeyhole, RefreshCw, Shield, Star, Swords } from "lucide-react";
import { api } from "@/lib/api";

type QuestLevel = {
  id: string;
  sequence: number;
  title: string;
  description: string;
  type: string;
  skill_category: string;
  required_question_count: number;
  available_question_count: number;
  difficulty: string;
  duration_minutes: number;
  is_milestone: boolean;
  status: "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" | "MASTERED";
  prerequisite_level_ids: string[];
  can_start: boolean;
  unavailable_reason: string | null;
  prerequisite_titles: string[];
  stars: number;
  best_accuracy: number | null;
  attempts: number;
  battle_id: string | null;
};

type QuestMapData = {
  map_id: string;
  title: string;
  completed_levels: number;
  total_levels: number;
  total_xp: number;
  levels: QuestLevel[];
};

const mapPositions: Record<string, { x: number; y: number }> = {
  "arrays-foundation": { x: 50, y: 91 },
  "strings-practice": { x: 50, y: 78 },
  "hashing-skill": { x: 29, y: 64 },
  "linked-list-skill": { x: 71, y: 64 },
  "sql-select-skill": { x: 20, y: 49 },
  "sql-join-skill": { x: 20, y: 35 },
  "debugging-speed": { x: 50, y: 24 },
  "dsa-boss": { x: 80, y: 24 },
  "placement-checkpoint": { x: 50, y: 9 },
};

function statusLabel(level: QuestLevel): string {
  if (level.status === "AVAILABLE" && !level.can_start) return "Battle unavailable";
  return level.status.replaceAll("_", " ").toLowerCase();
}

export default function BattleQuestMap() {
  const router = useRouter();
  const [map, setMap] = useState<QuestMapData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMap() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<QuestMapData>("/quest-map");
      setMap(response.data);
      setSelectedId((current) => current && response.data.levels.some((level) => level.id === current)
        ? current
        : response.data.levels.find((level) => level.status === "AVAILABLE" || level.status === "IN_PROGRESS")?.id
          ?? response.data.levels[0]?.id
          ?? null);
    } catch {
      setError("Quest Map data could not be loaded. Your progress has not changed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMap();
  }, []);

  const selected = map?.levels.find((level) => level.id === selectedId) ?? null;

  async function startSelectedLevel() {
    if (!selected || starting || (!selected.can_start && !selected.battle_id)) return;
    setStarting(true);
    setError(null);
    try {
      const response = await api.post<{ battle_id: string }>(`/quest-map/levels/${encodeURIComponent(selected.id)}/start`);
      router.push(`/battle/${response.data.battle_id}`);
    } catch (startError: unknown) {
      const detail = (startError as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || "The server could not start this battle. No quest progress was changed.");
      await loadMap();
    } finally {
      setStarting(false);
    }
  }

  const nodeClass = (level: QuestLevel, isSelected: boolean) => {
    const stateClass = level.status === "COMPLETED" || level.status === "MASTERED"
      ? "border-emerald-300/60 bg-emerald-950/90 text-emerald-100"
      : level.status === "IN_PROGRESS"
        ? "border-cyan-300/70 bg-cyan-950/90 text-cyan-100"
        : level.status === "AVAILABLE"
          ? "border-sky-300/60 bg-slate-950 text-sky-100"
          : "border-white/15 bg-slate-950/90 text-slate-400";
    return `border ${stateClass} ${isSelected ? "ring-2 ring-cyan-300 ring-offset-2 ring-offset-[#07131b]" : "hover:border-white/50"}`;
  };

  function renderNode(level: QuestLevel, isSelected: boolean, compact = false) {
    const Icon = level.status === "LOCKED" ? LockKeyhole : level.is_milestone ? Shield : level.status === "COMPLETED" || level.status === "MASTERED" ? Check : Swords;
    return (
      <button
        type="button"
        key={level.id}
        aria-pressed={isSelected}
        aria-label={`Level ${level.sequence}: ${level.title}, ${statusLabel(level)}`}
        onClick={() => setSelectedId(level.id)}
        className={`flex min-h-[68px] w-full items-center gap-3 rounded-lg px-3 text-left shadow-lg transition-colors ${nodeClass(level, isSelected)} ${compact ? "max-w-none" : "max-w-[190px]"}`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-current/25 bg-white/5 text-xs font-bold tabular-nums">
          {level.status === "COMPLETED" || level.status === "MASTERED" ? <Icon size={17} /> : <span>{String(level.sequence).padStart(2, "0")}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{level.title}</span>
          <span className="mt-1 block truncate text-[10px] uppercase text-slate-400">{statusLabel(level)}</span>
        </span>
        {(level.status === "COMPLETED" || level.status === "MASTERED") && (
          <span className="flex shrink-0 items-center gap-0.5 text-amber-300" aria-label={`${level.stars} stars`}>
            {Array.from({ length: 3 }, (_, index) => <Star key={index} size={12} fill={index < level.stars ? "currentColor" : "none"} />)}
          </span>
        )}
      </button>
    );
  }

  if (loading && !map) {
    return <section id="quest-map" aria-busy="true" className="rounded-xl border border-white/10 bg-[#0b1720] p-6 text-sm text-slate-300">Loading your Quest Map…</section>;
  }

  return (
    <section id="quest-map" className="scroll-mt-24 overflow-hidden rounded-xl border border-cyan-300/15 bg-[#08131b] text-white shadow-[0_24px_70px_rgba(4,20,27,0.45)]">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 bg-[linear-gradient(110deg,rgba(10,45,51,0.95),rgba(8,19,27,0.94)_62%,rgba(30,42,53,0.9))] px-5 py-5 sm:px-7">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Battle Arena / progression</p>
          <h2 className="mt-2 text-2xl font-black">Quest Map</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-300">A placement journey built from your real battle evidence.</p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm">
          <div><span className="block text-[10px] uppercase text-slate-400">Levels</span><strong className="tabular-nums">{map?.completed_levels ?? 0}/{map?.total_levels ?? 0}</strong></div>
          <div><span className="block text-[10px] uppercase text-slate-400">Battle XP</span><strong className="tabular-nums">{map?.total_xp ?? 0}</strong></div>
          <button type="button" aria-label="Refresh Quest Map" onClick={() => void loadMap()} disabled={loading} className="self-end rounded-md border border-white/15 p-2 text-slate-200 hover:bg-white/10 disabled:opacity-50"><RefreshCw size={16} /></button>
        </div>
      </header>

      {error && <p role="alert" className="mx-5 mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100 sm:mx-7">{error}</p>}

      {!map ? (
        <div className="p-7 text-sm text-slate-300">
          <p className="flex items-center gap-2"><AlertTriangle size={16} /> Quest Map is unavailable.</p>
          <button type="button" onClick={() => void loadMap()} className="mt-3 text-cyan-200 underline underline-offset-4">Retry</button>
        </div>
      ) : (
        <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(270px,0.75fr)]">
          <div className="min-w-0">
            <div className="hidden overflow-x-auto rounded-lg border border-white/5 bg-[#071019] md:block">
              <div className="relative mx-auto h-[680px] min-w-[620px] max-w-[840px]">
                <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                  <defs><linearGradient id="quest-path" x1="0" x2="0" y1="1" y2="0"><stop offset="0%" stopColor="#22d3ee" stopOpacity="0.18" /><stop offset="55%" stopColor="#22d3ee" stopOpacity="0.55" /><stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8" /></linearGradient></defs>
                  {map.levels.flatMap((level) => level.prerequisite_level_ids.map((from) => ({ from, to: level.id }))).map(({ from, to }) => {
                    const start = mapPositions[from];
                    const end = mapPositions[to];
                    if (!start || !end) return null;
                    return <path key={`${from}-${to}`} d={`M ${start.x} ${100 - start.y} L ${end.x} ${100 - end.y}`} fill="none" stroke="url(#quest-path)" strokeWidth="0.45" strokeDasharray="1.4 1.2" />;
                  })}
                </svg>
                {map.levels.map((level) => {
                  const position = mapPositions[level.id] ?? { x: 50, y: 50 };
                  return <div key={level.id} className="absolute w-[190px] -translate-x-1/2 -translate-y-1/2" style={{ left: `${position.x}%`, top: `${100 - position.y}%` }}>{renderNode(level, selectedId === level.id)}</div>;
                })}
              </div>
            </div>

            <ol aria-label="Quest progression" className="relative space-y-3 pl-5 before:absolute before:bottom-5 before:left-[11px] before:top-5 before:w-px before:bg-gradient-to-b before:from-cyan-300/60 before:via-cyan-300/20 before:to-transparent md:hidden">
              {map.levels.map((level) => <li key={level.id} className="relative pl-3 before:absolute before:left-[-17px] before:top-1/2 before:h-2 before:w-2 before:-translate-y-1/2 before:rounded-full before:bg-cyan-300/70">{renderNode(level, selectedId === level.id, true)}</li>)}
            </ol>
          </div>

          <aside aria-label="Quest level details" className="min-w-0 border-t border-white/10 pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
            {selected ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">Level {String(selected.sequence).padStart(2, "0")} · {selected.type.replaceAll("_", " ")}</p>
                    <h3 className="mt-2 text-xl font-black">{selected.title}</h3>
                  </div>
                  {selected.is_milestone && <Shield size={22} className="shrink-0 text-amber-300" aria-label="Milestone" />}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{selected.description}</p>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-white/10 py-4 text-sm">
                  <div><dt className="text-[10px] uppercase text-slate-400">Skill</dt><dd className="mt-1 font-semibold">{selected.skill_category}</dd></div>
                  <div><dt className="text-[10px] uppercase text-slate-400">Difficulty</dt><dd className="mt-1 font-semibold capitalize">{selected.difficulty}</dd></div>
                  <div><dt className="text-[10px] uppercase text-slate-400">Battle</dt><dd className="mt-1 font-semibold">{selected.required_question_count} questions · {selected.duration_minutes} min</dd></div>
                  <div><dt className="text-[10px] uppercase text-slate-400">Validated inventory</dt><dd className="mt-1 font-semibold tabular-nums">{selected.available_question_count}/{selected.required_question_count}</dd></div>
                  <div><dt className="text-[10px] uppercase text-slate-400">Best result</dt><dd className="mt-1 font-semibold">{selected.best_accuracy === null ? "No result yet" : `${selected.best_accuracy}% · ${selected.stars} stars`}</dd></div>
                  <div><dt className="text-[10px] uppercase text-slate-400">Attempts</dt><dd className="mt-1 font-semibold tabular-nums">{selected.attempts}</dd></div>
                </dl>
                {selected.status === "LOCKED" && selected.unavailable_reason && <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300"><LockKeyhole className="mr-2 inline h-4 w-4 text-slate-400" />{selected.unavailable_reason}</p>}
                {selected.status === "AVAILABLE" && !selected.can_start && <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100"><AlertTriangle className="mr-2 inline h-4 w-4" />{selected.unavailable_reason || "Battle unavailable: not enough validated questions."}</p>}
                {(selected.status === "COMPLETED" || selected.status === "MASTERED") && <p className="mt-4 flex items-center gap-2 text-sm text-emerald-200"><Check size={16} /> Completed from a recorded battle result</p>}
                <p className="mt-4 text-xs text-slate-400">Rewards use the standard Battle result and XP system.</p>
                <button
                  type="button"
                  onClick={() => void startSelectedLevel()}
                  disabled={starting || (selected.status !== "IN_PROGRESS" && !selected.can_start)}
                  className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
                >
                  <Swords size={17} />
                  {starting ? "Preparing battle…" : selected.status === "IN_PROGRESS" ? "Resume battle" : "Start battle"}
                </button>
              </>
            ) : <p className="text-sm text-slate-400">Select a level to inspect its requirements.</p>}
          </aside>
        </div>
      )}
    </section>
  );
}