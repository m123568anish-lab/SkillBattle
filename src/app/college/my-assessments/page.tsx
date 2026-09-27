"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { collegeService, Assessment } from "@/services/college.service";
import { Award, Clock, Send, CheckCircle2, Play, AlertCircle } from "lucide-react";

export default function StudentMyAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyAssessments();
  }, []);

  const fetchMyAssessments = async () => {
    try {
      setLoading(true);
      const data = await collegeService.getMyAssignedAssessments();
      setAssessments(data);
    } catch (err) {
      console.error("Failed to load assigned college assessments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (a: Assessment) => {
    setActiveAssessment(a);
    setAnswers({});
    setResult(null);
  };

  const handleSubmitAnswers = async () => {
    if (!activeAssessment) return;
    try {
      setSubmitting(true);
      const res = await collegeService.submitAssessment(activeAssessment.id, answers);
      setResult(res);
    } catch (err) {
      console.error("Error submitting assessment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
          📝 My Assigned College Assessments
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Official placement evaluations and cohort technical assessments assigned by your institution's Placement Cell.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Assigned Tests List */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Award className="h-4 w-4 text-cyan-400" /> Active Placement Tests
            </h3>

            {loading ? (
              <p className="text-xs text-slate-500">Loading your college assessments...</p>
            ) : assessments.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-slate-800/40 p-4 text-xs text-slate-400 text-center space-y-2">
                <AlertCircle className="mx-auto h-6 w-6 text-amber-400" />
                <p>No active assessments assigned to your cohort currently.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => handleStartTest(a)}
                    className={`cursor-pointer rounded-2xl p-4 border transition ${
                      activeAssessment?.id === a.id
                        ? "border-cyan-500/50 bg-cyan-500/10 text-white"
                        : "border-white/5 bg-slate-800/40 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="font-bold text-sm">{a.title}</div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                      <span>{a.assessment_type}</span>
                      <span className="flex items-center gap-1 text-cyan-300"><Clock className="h-3 w-3" /> {a.duration_minutes} Mins</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Test Room */}
        <div className="lg:col-span-2">
          {!activeAssessment ? (
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center backdrop-blur-xl space-y-3">
              <Award className="mx-auto h-16 w-16 text-cyan-400 animate-pulse" />
              <h2 className="text-xl font-bold text-white">No Assessment Selected</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select an active assessment from the left menu to start your test.
              </p>
            </div>
          ) : result ? (
            /* Result Card */
            <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/60 p-8 backdrop-blur-xl space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{activeAssessment.title} Submitted</h3>
                    <p className="text-xs text-slate-400">Official Evaluation Result</p>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full font-bold text-xs ${result.is_passed ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"}`}>
                  {result.is_passed ? "PASSED" : "NEEDS IMPROVEMENT"}
                </span>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-4 space-y-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Total Score</span>
                  <div className="text-2xl font-black text-cyan-300">{result.total_score} pts</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-4 space-y-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Percentage</span>
                  <div className="text-2xl font-black text-emerald-400">{result.percentage}%</div>
                </div>
              </div>

              <button
                onClick={() => { setActiveAssessment(null); setResult(null); }}
                className="w-full rounded-xl bg-white/10 py-3 text-xs font-bold text-white hover:bg-white/20 transition"
              >
                Back to My Assessments List
              </button>
            </div>
          ) : (
            /* Active Test View */
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-8 backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{activeAssessment.title}</h3>
                  <p className="text-xs text-slate-400">{activeAssessment.description || "Complete all questions before submitting."}</p>
                </div>
                <span className="rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1 text-xs font-bold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {activeAssessment.duration_minutes} Mins
                </span>
              </div>

              {/* Sample Test Questions */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/5 bg-slate-800/40 p-5 space-y-3">
                  <div className="text-xs font-bold text-cyan-400 uppercase">Question 1 (MCQ)</div>
                  <h4 className="text-sm font-bold text-white">What is the average time complexity of QuickSort?</h4>

                  <div className="grid gap-2 grid-cols-2 pt-2">
                    {["O(N log N)", "O(N^2)", "O(N)", "O(1)"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers({ ...answers, q_1: opt })}
                        className={`rounded-xl p-3 text-xs font-medium text-left border transition ${
                          answers.q_1 === opt
                            ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                            : "border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-800/40 p-5 space-y-3">
                  <div className="text-xs font-bold text-violet-400 uppercase">Question 2 (Coding Task)</div>
                  <h4 className="text-sm font-bold text-white">Implement a function to find the maximum subarray sum (Kadane's Algorithm).</h4>
                  <textarea
                    rows={5}
                    value={answers.q_2_code || ""}
                    onChange={(e) => setAnswers({ ...answers, q_2_code: e.target.value })}
                    placeholder="def max_subarray(nums):\n    # Write python code here..."
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/10">
                <button
                  onClick={handleSubmitAnswers}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> {submitting ? "Evaluating Test..." : "Submit Final Assessment"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
