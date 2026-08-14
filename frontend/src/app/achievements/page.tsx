"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import api from "@/services/api";
import { Lock, Unlock, Star, Trophy, Flame, Zap } from "lucide-react";

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/achievements/user")
      .then((r) => setAchievements(r.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
            🏅 Achievements Gallery
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Collect badges by mastering algorithms, climbing rankings, and conquering the battlefield.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400">
            {unlocked.length} / {achievements.length} Unlocked
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Unlocked Section */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-emerald-400">
              <Unlock className="h-5 w-5" /> Earned Achievements ({unlocked.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unlocked.map((ach) => (
                <div
                  key={ach.id}
                  className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10"
                >
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-500/10 blur-2xl transition-opacity group-hover:opacity-60" />
                  <div className="text-4xl mb-3">{ach.icon}</div>
                  <h3 className="font-extrabold text-white">{ach.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">{ach.description}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">{ach.xp_threshold} XP Required</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locked Section */}
          {locked.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-500">
                <Lock className="h-5 w-5" /> Locked Achievements ({locked.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {locked.map((ach) => (
                  <div
                    key={ach.id}
                    className="rounded-2xl border border-white/5 bg-slate-900/30 p-6 opacity-50"
                  >
                    <div className="text-4xl mb-3 grayscale">{ach.icon}</div>
                    <h3 className="font-extrabold text-slate-400">{ach.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{ach.description}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-xs font-bold text-slate-500">Requires {ach.xp_threshold} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
