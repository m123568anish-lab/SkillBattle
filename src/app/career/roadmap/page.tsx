"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { careerService, Roadmap } from "@/services/career.service";
import { CheckCircle2, Circle, Clock, Award, Target, Plus, Sparkles, ChevronRight, Layers } from "lucide-react";

export default function CareerRoadmapPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [targetCompany, setTargetCompany] = useState("Google");
  const [title, setTitle] = useState("FAANG Algorithmic Mastery");
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      const data = await careerService.getUserRoadmaps();
      setRoadmaps(data);
      if (data.length > 0) {
        setSelectedRoadmap(data[0]);
      }
    } catch (err) {
      console.error("Failed to load roadmaps:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const newRoadmap = await careerService.generateRoadmap(title, targetCompany, durationWeeks);
      setRoadmaps([newRoadmap, ...roadmaps]);
      setSelectedRoadmap(newRoadmap);
      setShowCreateModal(false);
    } catch (err) {
      console.error("Error creating roadmap:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (taskId: number, currentStatus: boolean) => {
    if (currentStatus) return; // Already completed
    try {
      await careerService.completeTask(taskId);
      // Local optimistic update
      if (selectedRoadmap) {
        const updatedWeeks = selectedRoadmap.weeks.map((week) => ({
          ...week,
          tasks: week.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: true } : task
          ),
        }));
        setSelectedRoadmap({ ...selectedRoadmap, weeks: updatedWeeks });
      }
    } catch (err) {
      console.error("Failed to complete task:", err);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
            🗺️ Career Preparation Roadmap
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Structured week-by-week algorithmic learning paths tailored for dream tech companies.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
        >
          <Plus className="h-5 w-5" />
          Generate New Roadmap
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        </div>
      ) : roadmaps.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center backdrop-blur-xl">
          <Target className="mx-auto h-16 w-16 text-cyan-400 mb-4" />
          <h2 className="text-2xl font-bold text-white">No Career Roadmaps Active</h2>
          <p className="mt-2 text-slate-400 max-w-md mx-auto">
            Build your custom preparation schedule targetting companies like Google, Meta, Amazon, or Microsoft.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
          >
            Create My First Roadmap
          </button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Roadmap Selector */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-violet-400" />
              Active Roadmaps ({roadmaps.length})
            </h3>
            <div className="space-y-3">
              {roadmaps.map((rm) => (
                <div
                  key={rm.id}
                  onClick={() => setSelectedRoadmap(rm)}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                    selectedRoadmap?.id === rm.id
                      ? "border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                      : "border-white/5 bg-slate-900/50 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-cyan-500/20 px-2.5 py-1 text-xs font-bold text-cyan-400">
                      {rm.target_company}
                    </span>
                    <span className="text-xs text-slate-400">{rm.duration_weeks} Weeks</span>
                  </div>
                  <h4 className="mt-3 font-bold text-white">{rm.title}</h4>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>Est. {rm.estimated_hours} Hours</span>
                    <span className="flex items-center gap-1 font-semibold text-violet-400">
                      View Timeline <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Selected Roadmap Timeline */}
          {selectedRoadmap && (
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div>
                    <span className="rounded-lg bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Target: {selectedRoadmap.target_company}
                    </span>
                    <h2 className="text-2xl font-extrabold text-white mt-2">{selectedRoadmap.title}</h2>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-violet-400" />
                      <span>{selectedRoadmap.estimated_hours} Hours</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-yellow-400" />
                      <span>{selectedRoadmap.duration_weeks} Weeks</span>
                    </div>
                  </div>
                </div>

                {/* Weeks Timeline */}
                <div className="mt-8 space-y-8">
                  {selectedRoadmap.weeks?.map((week) => (
                    <div key={week.id} className="relative pl-6 border-l-2 border-violet-500/30 space-y-4">
                      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                      
                      <div>
                        <h3 className="text-lg font-bold text-white">{week.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{week.objective}</p>
                      </div>

                      {/* Tasks List */}
                      <div className="space-y-2.5 pt-2">
                        {week.tasks?.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => handleToggleTask(task.id, task.completed)}
                            className={`flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer ${
                              task.completed
                                ? "border-emerald-500/30 bg-emerald-500/5 text-slate-400 opacity-80"
                                : "border-white/5 bg-slate-800/40 hover:border-violet-500/40 hover:bg-slate-800/80"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {task.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <Circle className="h-5 w-5 text-slate-500 flex-shrink-0" />
                              )}
                              <div>
                                <p className={`text-sm font-semibold ${task.completed ? "line-through text-slate-400" : "text-white"}`}>
                                  {task.topic}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                  <span>Day {task.day}</span>
                                  <span>•</span>
                                  <span className={task.difficulty === "Hard" ? "text-rose-400 font-bold" : "text-amber-400 font-bold"}>
                                    {task.difficulty}
                                  </span>
                                  <span>•</span>
                                  <span>{task.estimated_minutes} min</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-400">
                              <Award className="h-3.5 w-3.5" />
                              +{task.reward_xp} XP
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal to create roadmap */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Generate Career Roadmap</h3>
            <p className="mt-1 text-xs text-slate-400">Configure your target company and weekly schedule.</p>

            <form onSubmit={handleCreateRoadmap} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Roadmap Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Target Company</label>
                <select
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                >
                  <option value="Google">Google</option>
                  <option value="Meta">Meta</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Microsoft">Microsoft</option>
                  <option value="Apple">Apple</option>
                  <option value="Netflix">Netflix</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Duration (Weeks)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-slate-400 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Build Roadmap"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
