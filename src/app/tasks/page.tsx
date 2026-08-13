"use client";

import React, { useEffect, useState } from "react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("__tasks") || "[]");
    } catch {
      return [];
    }
  });

  const [value, setValue] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("__tasks", JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  function addTask() {
    const v = value.trim();
    if (!v) return;
    setTasks((s) => [v, ...s]);
    setValue("");
  }

  function removeTask(idx: number) {
    setTasks((s) => s.filter((_, i) => i !== idx));
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-2xl font-semibold">Any Task</h1>

        <div className="mb-4 flex gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Describe a task..."
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          />

          <button
            onClick={addTask}
            className="rounded-lg bg-cyan-500 px-4 py-3 font-medium text-black"
          >
            Add
          </button>
        </div>

        <ul className="space-y-2">
          {tasks.length === 0 && (
            <li className="text-sm text-slate-400">No tasks yet</li>
          )}

          {tasks.map((t, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-md border border-white/6 bg-white/3 px-4 py-3"
            >
              <span>{t}</span>

              <button
                onClick={() => removeTask(i)}
                className="ml-4 rounded bg-red-600 px-3 py-1 text-sm"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
