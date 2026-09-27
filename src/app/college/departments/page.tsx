"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { collegeService, Department, Batch } from "@/services/college.service";
import { Layers, Plus, Calendar, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // New Department Form
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [headName, setHeadName] = useState("");

  // New Batch Form
  const [batchName, setBatchName] = useState("");
  const [passoutYear, setPassoutYear] = useState(2027);
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>(undefined);

  const [savingDept, setSavingDept] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dList, bList] = await Promise.all([
        collegeService.getDepartments(),
        collegeService.getBatches(),
      ]);
      setDepartments(dList);
      setBatches(bList);
    } catch (err) {
      console.error("Failed to fetch departments/batches:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    try {
      setSavingDept(true);
      const newDept = await collegeService.createDepartment(deptName, deptCode, headName);
      setDepartments([...departments, newDept]);
      setDeptName("");
      setDeptCode("");
      setHeadName("");
      setMsg("Department successfully created!");
    } catch (err: any) {
      console.error("Error creating department:", err);
      setMsg("Failed to create department.");
    } finally {
      setSavingDept(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName) return;
    try {
      setSavingBatch(true);
      const newBatch = await collegeService.createBatch(batchName, passoutYear, selectedDeptId);
      setBatches([...batches, newBatch]);
      setBatchName("");
      setMsg("Batch successfully created!");
    } catch (err: any) {
      console.error("Error creating batch:", err);
      setMsg("Failed to create batch.");
    } finally {
      setSavingBatch(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
            🏢 Departments & Academic Batches
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Structure your college academic units and graduation cohorts to target placement assessments effectively.
          </p>
        </div>

        <Link
          href="/college/dashboard"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition"
        >
          Back to Placement Dashboard
        </Link>
      </div>

      {msg && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {msg}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Department Management */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" /> Add New Department
            </h3>

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Dept Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Head of Dept (HOD)</label>
                  <input
                    type="text"
                    placeholder="Prof. Sharma"
                    value={headName}
                    onChange={(e) => setHeadName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingDept}
                className="w-full rounded-xl bg-cyan-600 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> {savingDept ? "Saving..." : "Create Department"}
              </button>
            </form>
          </div>

          {/* Department List */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-300">Enrolled Departments ({departments.length})</h3>
            {departments.length === 0 ? (
              <p className="text-xs text-slate-500">No departments added yet.</p>
            ) : (
              <div className="space-y-3">
                {departments.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-800/40 p-4">
                    <div>
                      <div className="font-bold text-white text-sm">{d.name} ({d.code})</div>
                      <div className="text-xs text-slate-400">HOD: {d.head_name || "N/A"}</div>
                    </div>
                    <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300 border border-cyan-500/30">
                      ID #{d.id}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Batch Management */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-400" /> Create Academic Batch / Cohort
            </h3>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Batch Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Batch 2023-2027 (CSE-A)"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Passout Graduation Year</label>
                  <input
                    type="number"
                    value={passoutYear}
                    onChange={(e) => setPassoutYear(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Associated Department</label>
                  <select
                    value={selectedDeptId || ""}
                    onChange={(e) => setSelectedDeptId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                  >
                    <option value="">-- All Departments --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingBatch}
                className="w-full rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white hover:bg-violet-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> {savingBatch ? "Saving..." : "Create Batch Cohort"}
              </button>
            </form>
          </div>

          {/* Batch List */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-300">Enrolled Batches ({batches.length})</h3>
            {batches.length === 0 ? (
              <p className="text-xs text-slate-500">No batch cohorts created yet.</p>
            ) : (
              <div className="space-y-3">
                {batches.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-800/40 p-4">
                    <div>
                      <div className="font-bold text-white text-sm">{b.name}</div>
                      <div className="text-xs text-slate-400">Graduation Class of {b.passout_year}</div>
                    </div>
                    <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-300 border border-violet-500/30">
                      ID #{b.id}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
