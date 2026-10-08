"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  xp_threshold: number;
}

export default function AchievementWidget() {
  const [achievementsList, setAchievementsList] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await api.get<Achievement[]>("/achievements/user");
        if (active) {
          setAchievementsList(response.data);
        }
      } catch (err: any) {
        if (active) {
          setError("Unable to load achievements.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-8"
    >
      <h2 className="mb-8 text-2xl font-black text-white">
        🏆 Achievements
      </h2>

      {error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : loading ? (
        <p className="text-sm text-slate-400">Loading your achievements...</p>
      ) : achievementsList.length === 0 ? (
        <p className="text-sm text-slate-400">No achievements available yet.</p>
      ) : (
        <div className="space-y-5">
          {achievementsList.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              className={`rounded-2xl border p-5 transition-all ${
                item.unlocked
                  ? "border-yellow-500/30 bg-yellow-500/10"
                  : "border-white/10 bg-white/5 opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{item.icon}</span>
                <div>
                  <h3 className="font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}