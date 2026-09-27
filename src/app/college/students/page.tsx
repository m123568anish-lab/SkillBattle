"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { collegeService, CollegeStudent, Department, Batch } from "@/services/college.service";
import { Users, UserPlus, Search, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function StudentsPage() {
  const [students, setStudents] = useState<CollegeStudent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [userIdentifier, setUserIdentifier] = useState("");
  const [deptId, setDeptId] = useState<number | undefined>(undefined);
  const [batchId, setBatchId] = useState<number | undefined>(undefined);
  const [rollNumber, setRollNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stList, dList, bList] = await Promise.all([
        collegeService.getStudents(),
        collegeService.getDepartments(),
        collegeService.getBatches(),
      ]);
      setStudents(stList);
      setDepartments(dList);
      setBatches(bList);
    } catch (err: any) {
      console.error("Failed to fetch students:", err);
      setErrorMsg("Failed to load student roster. Placement Officer permissions required.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdentifier.trim()) return;

    try {
      setSubmitting(true);
      setMsg("");
      setErrorMsg("");
      await collegeService.addStudent(userIdentifier, deptId, batchId, rollNumber);
      setMsg(`Student '${userIdentifier}' enrolled successfully!`);
      setUserIdentifier("");
      setRollNumber("");
      fetchData();
    } catch (err: any) {
      console.error("Error adding student:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to add student. Ensure user is registered on SkillBattle.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
            👨‍🎓 Enrolled Student Roster
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage student enrollment, assign academic departments, and track placement readiness.
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

      {errorMsg && (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-400" /> {errorMsg}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Enroll Student Form */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan-400" /> Enroll Student into College
            </h3>

            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Student Email or Username *</label>
                <input
                  type="text"
                  required
                  placeholder="student1@iitd.ac.in or username"
                  value={userIdentifier}
                  onChange={(e) => setUserIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Roll / Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. 2023CSE1001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Department</label>
                <select
                  value={deptId || ""}
                  onChange={(e) => setDeptId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Batch Cohort</label>
                <select
                  value={batchId || ""}
                  onChange={(e) => setBatchId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">-- Select Batch --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? "Enrolling..." : "Enroll Student"}
              </button>
            </form>
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2"><Users className="h-5 w-5 text-violet-400" /> Active Student Directory</span>
              <span className="text-xs text-slate-400 font-semibold">{students.length} Enrolled</span>
            </h3>

            {students.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No students enrolled yet. Use the form on the left to add students.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-slate-400 uppercase">
                    <tr>
                      <th className="pb-3 font-bold">Candidate</th>
                      <th className="pb-3 font-bold">Roll No</th>
                      <th className="pb-3 font-bold">Department</th>
                      <th className="pb-3 font-bold">Batch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {students.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-800/40">
                        <td className="py-3">
                          <div className="font-bold text-white">{st.full_name || st.username}</div>
                          <div className="text-[10px] text-slate-400">{st.email}</div>
                        </td>
                        <td className="py-3 font-mono text-cyan-300">{st.roll_number || "—"}</td>
                        <td className="py-3 text-slate-300">{st.department_name}</td>
                        <td className="py-3 text-slate-300">{st.batch_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
