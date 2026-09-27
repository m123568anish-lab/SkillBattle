"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { collegeService, Assessment, Department, Batch } from "@/services/college.service";
import { Award, Plus, Calendar, CheckCircle2, ChevronRight, BarChart3, Trophy } from "lucide-react";
import Link from "next/link";

export default function CollegeAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedResults, setSelectedResults] = useState<any[] | null>(null);
  const [activeAssessmentTitle, setActiveAssessmentTitle] = useState("");
  const [loading, setLoading] = useState(true);

  // Assessment Creation Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("HYBRID");
  const [duration, setDuration] = useState(60);
  const [passMarks, setPassMarks] = useState(50);
  const [totalMarks, setTotalMarks] = useState(100);
  const [mcqQuestion, setMcqQuestion] = useState("");
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");
  const [opt4, setOpt4] = useState("");
  const [correctOpt, setCorrectOpt] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aList, dList, bList] = await Promise.all([
        collegeService.getAssessments(),
        collegeService.getDepartments(),
        collegeService.getBatches(),
      ]);
      setAssessments(aList);
      setDepartments(dList);
      setBatches(bList);
    } catch (err) {
      console.error("Failed to load assessments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      setSubmitting(true);
      const questions = [];
      if (mcqQuestion.trim()) {
        questions.push({
          question_type: "MCQ",
          question_text: mcqQuestion,
          options: [opt1, opt2, opt3, opt4].filter(Boolean),
          correct_option: correctOpt || opt1,
          marks: 50,
        });
      }

      await collegeService.createAssessment({
        title,
        description,
        assessment_type: type,
        duration_minutes: duration,
        pass_marks: passMarks,
        total_marks: totalMarks,
        questions,
      });

      setMsg("Placement Assessment successfully created!");
      setTitle("");
      setDescription("");
      setMcqQuestion("");
      fetchData();
    } catch (err) {
      console.error("Error creating assessment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewResults = async (id: number, assessTitle: string) => {
    try {
      setActiveAssessmentTitle(assessTitle);
      const res = await collegeService.getAssessmentResults(id);
      setSelectedResults(res);
    } catch (err) {
      console.error("Error fetching results:", err);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
            📝 Placement Assessment Management
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Design hybrid technical tests, schedule cohort evaluations, and inspect real-time student performance rank lists.
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

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Create Assessment Form */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-cyan-400" /> Create New Assessment
            </h3>

            <form onSubmit={handleCreateAssessment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Assessment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Placement Technical Speedrun 2027"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Type & Format</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="HYBRID">Hybrid (MCQ + Coding Challenge)</option>
                  <option value="MCQ">MCQ Aptitude Round</option>
                  <option value="CODING">Coding Assessment</option>
                </select>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Pass Marks</label>
                  <input
                    type="number"
                    value={passMarks}
                    onChange={(e) => setPassMarks(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sample MCQ Question */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <label className="block text-xs font-bold text-cyan-400 uppercase">Include Technical Question</label>
                <input
                  type="text"
                  placeholder="e.g. Time complexity of binary search?"
                  value={mcqQuestion}
                  onChange={(e) => setMcqQuestion(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />

                <div className="grid gap-2 grid-cols-2">
                  <input
                    type="text"
                    placeholder="Option A"
                    value={opt1}
                    onChange={(e) => setOpt1(e.target.value)}
                    className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Option B"
                    value={opt2}
                    onChange={(e) => setOpt2(e.target.value)}
                    className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Correct Answer (e.g. O(log N))"
                  value={correctOpt}
                  onChange={(e) => setCorrectOpt(e.target.value)}
                  className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 focus:outline-none font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? "Publishing..." : "Publish Assessment"}
              </button>
            </form>
          </div>
        </div>

        {/* Assessment List & Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2"><Award className="h-5 w-5 text-violet-400" /> College Assessments</span>
              <span className="text-xs text-slate-400 font-semibold">{assessments.length} Total</span>
            </h3>

            {assessments.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No assessments published yet. Use the form on the left to create one.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {assessments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-800/40 p-4 text-xs">
                    <div>
                      <div className="font-bold text-white text-sm">{a.title}</div>
                      <div className="text-[10px] text-slate-400">
                        {a.assessment_type} • {a.duration_minutes} Mins • Pass: {a.pass_marks}/{a.total_marks}
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewResults(a.id, a.title)}
                      className="rounded-xl bg-violet-600/30 border border-violet-500/30 px-3.5 py-1.5 text-xs font-bold text-violet-300 hover:bg-violet-600 hover:text-white transition flex items-center gap-1"
                    >
                      <Trophy className="h-3.5 w-3.5" /> View Results
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rank List Results */}
          {selectedResults && (
            <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" /> Rank List: {activeAssessmentTitle}
              </h3>

              {selectedResults.length === 0 ? (
                <p className="text-xs text-slate-400">No student submissions recorded for this assessment yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 text-slate-400 uppercase">
                      <tr>
                        <th className="pb-3 font-bold">Rank</th>
                        <th className="pb-3 font-bold">Candidate</th>
                        <th className="pb-3 font-bold">Score</th>
                        <th className="pb-3 font-bold">Percentage</th>
                        <th className="pb-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedResults.map((res) => (
                        <tr key={res.submission_id} className="hover:bg-slate-800/40">
                          <td className="py-3 font-bold text-amber-400">#{res.rank}</td>
                          <td className="py-3">
                            <div className="font-bold text-white">{res.student_name}</div>
                            <div className="text-[10px] text-slate-400">{res.student_email}</div>
                          </td>
                          <td className="py-3 font-mono text-cyan-300">{res.total_score} pts</td>
                          <td className="py-3 font-bold text-white">{res.percentage}%</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${res.is_passed ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                              {res.is_passed ? "PASSED" : "NEEDS IMPROVEMENT"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
