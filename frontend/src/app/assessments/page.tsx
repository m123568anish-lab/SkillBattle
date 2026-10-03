"use client";

import { FormEvent, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import api from "@/lib/api";

type AssignedQuestion = {
  id: number;
  question_type: string;
  skill_category: string;
  question_text: string;
  options: string[];
  coding_starter_code: string;
  marks: number;
};

type AssignedAssessment = {
  id: number;
  college_id: number;
  title: string;
  description: string;
  assessment_type: string;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  status: string;
  pass_marks: number;
  total_marks: number;
  questions: AssignedQuestion[];
};

type SubmissionResult = {
  percentage: number;
  total_score: number;
  is_passed: boolean;
};

function getError(error: unknown): string {
  if (isAxiosError(error) && typeof error.response?.data?.detail === "string") return error.response.data.detail;
  return error instanceof Error ? error.message : "Assigned assessments could not be loaded.";
}

export default function AssignedAssessmentsPage() {
  const [assessments, setAssessments] = useState<AssignedAssessment[]>([]);
  const [answers, setAnswers] = useState<Record<number, Record<string, string>>>({});
  const [results, setResults] = useState<Record<number, SubmissionResult>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void api.get<AssignedAssessment[]>("/college/student/my-assessments")
      .then((response) => { if (active) setAssessments(response.data); })
      .catch((loadError: unknown) => { if (active) setError(getError(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function updateAnswer(assessmentId: number, questionId: number, value: string) {
    setAnswers((current) => ({
      ...current,
      [assessmentId]: { ...current[assessmentId], [`q_${questionId}`]: value },
    }));
  }

  async function submitAssessment(event: FormEvent<HTMLFormElement>, assessmentId: number) {
    event.preventDefault();
    setSubmittingId(assessmentId);
    setError(null);
    try {
      const response = await api.post<SubmissionResult>("/college/student/assessment/submit", {
        assessment_id: assessmentId,
        answers: answers[assessmentId] || {},
      });
      setResults((current) => ({ ...current, [assessmentId]: response.data }));
    } catch (submitError) {
      setError(getError(submitError));
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-5xl space-y-6 pb-8">
        <header className="border-b border-white/10 pb-5">
          <p className="text-xs font-semibold uppercase text-cyan-300">Learning and assessment</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">College assessments</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Assessments assigned to your enrolled college cohorts.</p>
        </header>
        {error && <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200">{error}</div>}
        {loading ? <p className="rounded-2xl border border-white/10 bg-[#0b1020] p-6 text-sm text-slate-400">Loading assigned assessments…</p>
          : assessments.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No assessments are currently assigned to your college account.</p>
            : <div className="space-y-5">{assessments.map((assessment) => {
              const result = results[assessment.id];
              return (
                <section key={assessment.id} className="rounded-2xl border border-white/10 bg-[#0b1020] p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                    <div><h2 className="text-lg font-semibold text-white">{assessment.title}</h2><p className="mt-1 text-sm text-slate-400">{assessment.description || assessment.assessment_type} · {assessment.duration_minutes} min</p></div>
                    {result && <span className={`rounded-full border px-3 py-1 text-xs ${result.is_passed ? "border-emerald-300/20 text-emerald-200" : "border-amber-300/20 text-amber-100"}`}>{result.is_passed ? "Passed" : "Submitted"} · {result.percentage}%</span>}
                  </div>
                  {result ? <p className="pt-4 text-sm text-slate-300">Result recorded: {result.total_score}/{assessment.total_marks} marks.</p> : (
                    <form className="space-y-5 pt-5" onSubmit={(event) => void submitAssessment(event, assessment.id)}>
                      {assessment.questions.map((question, questionIndex) => (
                        <fieldset key={question.id} className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                          <legend className="px-1 text-xs font-semibold uppercase text-cyan-200">Question {questionIndex + 1} · {question.skill_category} · {question.marks} marks</legend>
                          <p className="text-sm leading-6 text-white">{question.question_text}</p>
                          {question.question_type === "MCQ" ? (
                            <div className="grid gap-2 sm:grid-cols-2">{question.options.map((option) => <label key={option} className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 p-3 text-sm text-slate-300 hover:border-cyan-400/40"><input required type="radio" name={`q_${question.id}`} value={option} checked={answers[assessment.id]?.[`q_${question.id}`] === option} onChange={() => updateAnswer(assessment.id, question.id, option)} className="mt-1 accent-cyan-400" />{option}</label>)}</div>
                          ) : <textarea required rows={7} value={answers[assessment.id]?.[`q_${question.id}`] || question.coding_starter_code || ""} onChange={(event) => updateAnswer(assessment.id, question.id, event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#070B14] p-3 font-mono text-sm text-slate-200 outline-none focus:border-cyan-400" aria-label={`Code answer for question ${questionIndex + 1}`} />}
                        </fieldset>
                      ))}
                      <button type="submit" disabled={submittingId === assessment.id} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{submittingId === assessment.id ? "Submitting…" : "Submit assessment"}</button>
                    </form>
                  )}
                </section>
              );
            })}</div>}
      </main>
    </DashboardLayout>
  );
}
