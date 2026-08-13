"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function WaitingBattlesClient() {
  const [battles, setBattles] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const resp = await api.get("/battle/waiting");
        if (!mounted) return;
        setBattles(resp.data || []);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    const int = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(int); };
  }, []);

  return (
    <div className="p-4 rounded bg-gray-900 max-w-3xl mx-auto">
      <h3 className="font-semibold mb-2">Waiting Battles</h3>
      <ul>
        {battles.map((b) => (
          <li key={b.id} className="py-2 border-b border-gray-800">
            <a href={`/battle/${b.id}`} className="text-blue-400">{b.title || b.id}</a>
            <div className="text-sm text-gray-400">Players: {b.players?.length ?? 0}</div>
          </li>
        ))}
        {battles.length === 0 && <li className="text-sm text-gray-500">No waiting battles</li>}
      </ul>
    </div>
  );
}
