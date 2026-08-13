"use client";
import { useEffect, useState } from "react";
import { adminService, BattleSettings } from "@/services/admin.service";

export default function BattleSettingsForm() {
  const [settings, setSettings] = useState<BattleSettings>({
    battle_duration_minutes: 30,
    xp_multiplier: 1.0,
    allow_custom_battles: true,
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    adminService.getSettings().then(setSettings).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await adminService.updateSettings(settings);
      setMsg("Settings updated successfully!");
    } catch {
      setMsg("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl">
      <h3 className="mb-4 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 flex items-center gap-2">
        ⚙️ Global Battle Settings
      </h3>
      {msg && (
        <div className="mb-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 p-3 text-sm text-emerald-300">
          {msg}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Default Battle Duration (Minutes)
          </label>
          <input
            type="number"
            value={settings.battle_duration_minutes}
            onChange={(e) => setSettings({ ...settings, battle_duration_minutes: Number(e.target.value) })}
            className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
            min={5}
            max={180}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Global XP Multiplier
          </label>
          <input
            type="number"
            step="0.1"
            value={settings.xp_multiplier}
            onChange={(e) => setSettings({ ...settings, xp_multiplier: Number(e.target.value) })}
            className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
            min={0.5}
            max={10.0}
          />
        </div>

        <div className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            id="allow_custom"
            checked={settings.allow_custom_battles}
            onChange={(e) => setSettings({ ...settings, allow_custom_battles: e.target.checked })}
            className="h-4 w-4 rounded border-white/10 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
          />
          <label htmlFor="allow_custom" className="text-sm font-semibold text-slate-300">
            Allow Custom Private Battles
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
