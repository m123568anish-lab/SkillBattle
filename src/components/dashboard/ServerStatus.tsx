"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, CheckCircle2, RefreshCw, XCircle } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://skillbattle-api-2026.onrender.com";

export default function ServerStatus() {
  const [checking, setChecking] = useState(true);
  const [online, setOnline] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    const startedAt = Date.now();
    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      setOnline(response.ok);
      setResponseTime(Date.now() - startedAt);
    } catch {
      setOnline(false);
      setResponseTime(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-cyan-400" />
          <div>
            <h2 className="font-bold">Server status</h2>
            <p className="text-xs text-slate-400">SkillBattle API</p>
          </div>
        </div>
        <button
          type="button"
          onClick={checkHealth}
          disabled={checking}
          aria-label="Refresh server status"
          className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="mt-6 flex items-center gap-2">
        {checking ? (
          <span className="text-sm text-slate-300">Checking API...</span>
        ) : online ? (
          <><CheckCircle2 className="h-4 w-4 text-emerald-400" /><span className="text-sm font-semibold text-emerald-300">Operational</span></>
        ) : (
          <><XCircle className="h-4 w-4 text-rose-400" /><span className="text-sm font-semibold text-rose-300">Unavailable</span></>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {responseTime === null ? "Response time unavailable" : `Response time: ${responseTime} ms`}
      </p>
    </section>
  );
}