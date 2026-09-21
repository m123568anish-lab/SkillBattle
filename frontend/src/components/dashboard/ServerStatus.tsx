"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle, XCircle, Clock, Wifi, RefreshCw, ExternalLink } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://skillbattle-api.onrender.com";
const UPTIMEROBOT_API = "https://api.uptimerobot.com/v2/getMonitors";
const API_KEY = process.env.NEXT_PUBLIC_UPTIMEROBOT_API_KEY ?? "";

type ServiceStatus = "online" | "offline" | "checking";

export default function ServerStatus() {
  const [status, setStatus] = useState<ServiceStatus>("checking");
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [uptime, setUptime] = useState<string | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function checkHealth() {
    setRefreshing(true);
    const start = Date.now();
    try {
      const res = await fetch(`${BACKEND_URL}/health`, {
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      const elapsed = Date.now() - start;
      setResponseTime(elapsed);
      setStatus(res.ok ? "online" : "offline");
    } catch {
      setStatus("offline");
      setResponseTime(null);
    }
    setLastChecked(new Date());
    setRefreshing(false);
  }

  async function fetchUptimeRobot() {
    if (!API_KEY) return;
    try {
      const res = await fetch(UPTIMEROBOT_API, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          api_key: API_KEY,
          format: "json",
          custom_uptime_ranges: "30",
          response_times: "1",
          response_times_limit: "1",
        }),
      });
      const data = await res.json();
      if (data?.monitors?.[0]) {
        const m = data.monitors[0];
        setUptime(parseFloat(m.uptime).toFixed(2));
        if (m.responseTime) setResponseTime(m.responseTime);
        if (m.customUptimeRanges) {
          const bars = m.customUptimeRanges.split("-").map((v: string) =>
            parseFloat(v) > 50 ? 1 : 0
          );
          setHistory(bars.slice(0, 30));
        }
      }
    } catch {
      // ignore — direct ping covers status
    }
  }

  useEffect(() => {
    checkHealth();
    fetchUptimeRobot();
    const interval = setInterval(() => {
      checkHealth();
      fetchUptimeRobot();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = status === "online";
  const isChecking = status === "checking";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-[#090D1A]/60 p-6 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Activity className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Server Status</h3>
            <p className="text-xs text-slate-400">SkillBattle API — Render</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { checkHealth(); fetchUptimeRobot(); }}
            disabled={refreshing}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <a
            href={`${BACKEND_URL}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Status Pill */}
      <div className="flex items-center gap-4 mb-6">
        <AnimatePresence mode="wait">
          {isChecking ? (
            <motion.div key="checking" className="flex items-center gap-2 rounded-full bg-slate-500/10 border border-slate-500/20 px-4 py-2">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-400 animate-pulse" />
              <span className="text-sm font-semibold text-slate-300">Checking…</span>
            </motion.div>
          ) : isOnline ? (
            <motion.div key="online" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/30 px-4 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm font-bold text-green-400">Operational</span>
            </motion.div>
          ) : (
            <motion.div key="offline" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/30 px-4 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-bold text-red-400">Unavailable</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center">
          <Wifi className="h-3.5 w-3.5 text-cyan-400 mx-auto mb-1" />
          <p className="text-lg font-black text-white">
            {responseTime != null ? `${responseTime}ms` : "—"}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">Response</p>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center">
          <Activity className="h-3.5 w-3.5 text-violet-400 mx-auto mb-1" />
          <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">
            {uptime ? `${uptime}%` : isOnline ? "~99%" : "0%"}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">Uptime</p>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center">
          <Clock className="h-3.5 w-3.5 text-amber-400 mx-auto mb-1" />
          <p className="text-xs font-bold text-white">
            {lastChecked ? lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">Checked</p>
        </div>
      </div>

      {/* 30-day bars */}
      {history.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">30-Day History</p>
          <div className="flex items-end gap-0.5 h-8">
            {history.map((val, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.02 }}
                style={{ originY: 1 }}
                className={`flex-1 rounded-sm ${val === 1 ? "bg-green-500/70" : "bg-red-500/60"}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-slate-600">30 days ago</span>
            <span className="text-[9px] text-slate-600">Today</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-black/20 border border-white/5 px-3 py-2">
        <span className="text-[10px] text-slate-500 font-mono truncate">{BACKEND_URL}</span>
      </div>

      {!API_KEY && (
        <p className="mt-2 text-[10px] text-slate-600 text-center">
          Add NEXT_PUBLIC_UPTIMEROBOT_API_KEY to Vercel for detailed uptime history
        </p>
      )}
    </motion.div>
  );
}
