"use client";
import { useEffect, useState } from "react";
import { adminService, BattleLog } from "@/services/admin.service";

export default function BattleLogs() {
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getBattleLogs();
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 flex items-center gap-2">
          ⚔️ Battle Logs & Activity
        </h3>
        <button
          onClick={fetchLogs}
          className="rounded-xl border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-400">Loading battle logs...</div>
      ) : logs.length === 0 ? (
        <div className="py-8 text-center text-slate-500">No battle activity logged yet.</div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-800/40 p-3 text-sm">
              <div>
                <span className="font-semibold text-white">Room #{log.room_code || log.id.slice(0, 8)}</span>
                <span className="ml-2 text-xs uppercase px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">{log.mode}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-400 capitalize">{log.status}</span>
                <span className="text-xs text-slate-500">{log.created_at ? new Date(log.created_at).toLocaleTimeString() : "Recently"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
