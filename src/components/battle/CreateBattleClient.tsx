"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CreateBattleClient() {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const router = useRouter();

  async function create() {
    try {
      const resp = await api.post("/battle/create", { title, difficulty });
      toast.success("Battle created");
      router.push(`/battle/${resp.data.id}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to create");
    }
  }

  return (
    <div className="p-6 rounded bg-gray-900 max-w-3xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Create Battle</h2>
      <div className="mb-2">
        <label className="block text-sm">Title</label>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} className="mt-1 w-full rounded bg-gray-800 px-2 py-1" />
      </div>
      <div className="mb-2">
        <label className="block text-sm">Difficulty</label>
        <select value={difficulty} onChange={(e)=>setDifficulty(e.target.value)} className="mt-1 w-40 rounded bg-gray-800 px-2 py-1">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div className="mt-4">
        <button onClick={create} className="rounded bg-blue-600 px-3 py-1">Create</button>
      </div>
    </div>
  );
}
