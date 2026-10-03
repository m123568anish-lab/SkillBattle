"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { ArrowRight, ClipboardCheck, Users, Building2, Layers3, AlertTriangle, CalendarClock, BarChart3 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  CollegeAssessment,
  CollegeAssessmentResult,
  CollegeBatch,
  CollegeDashboardData,
  CollegeDepartment,
  CollegeStudent,
  organizationDashboardService,
} from "@/services/organization-dashboard.service";

const inputClass = "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20";
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

function errorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (error.response?.status === 403) return "College access is required for this workspace.";
  }
  return error instanceof Error ? error.message : "The college workspace could not be loaded.";
}

function Metric({ label, value, note, icon: Icon }: { label: string; value: string | number; note?: string; icon: typeof Users }) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-[#0b1020] p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <Icon className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
      </div>
      <p className="mt-4 text-3xl font-semibold tabular-nums text-white">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </section>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-[#0b1020] p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">{children}</p>;
}

export default function CollegeDashboardPage() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "overview";
  const [dashboard, setDashboard] = useState<CollegeDashboardData | null>(null);
  const [students, setStudents] = useState<CollegeStudent[]>([]);
  const [departments, setDepartments] = useState<CollegeDepartment[]>([]);
  const [batches, setBatches] = useState<CollegeBatch[]>([]);
  const [assessments, setAssessments] = useState<CollegeAssessment[]>([]);
  const [results, setResults] = useState<CollegeAssessmentResult[]>([]);
  const [assessmentId, setAssessmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const summary = await organizationDashboardService.getCollegeDashboard();
        if (!active) return;
        setDashboard(summary);

        if (view === "students") {
          const [studentRows, departmentRows, batchRows] = await Promise.all([
            organizationDashboardService.getCollegeStudents(),
            organizationDashboardService.getDepartments(),
            organizationDashboardService.getBatches(),
          ]);
          if (active) {
            setStudents(studentRows);
            setDepartments(departmentRows);
            setBatches(batchRows);
          }
        }
        if (view === "departments") setDepartments(await organizationDashboardService.getDepartments());
        if (view === "batches") {
          const [departmentRows, batchRows] = await Promise.all([
            organizationDashboardService.getDepartments(),
            organizationDashboardService.getBatches(),
          ]);
          if (active) {
            setDepartments(departmentRows);
            setBatches(batchRows);
          }
        }
        if (view === "assessments" || view === "results") {
          const [assessmentRows, departmentRows, batchRows] = await Promise.all([
            organizationDashboardService.getCollegeAssessments(),
            organizationDashboardService.getDepartments(),
            organizationDashboardService.getBatches(),
          ]);
          if (!active) return;
          setAssessments(assessmentRows);
          setDepartments(departmentRows);
          setBatches(batchRows);
          if (view === "results" && assessmentId) {
            setResults(await organizationDashboardService.getAssessmentResults(Number(assessmentId)));
          }
        }
      } catch (loadError) {
        if (active) setError(errorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [view, refreshVersion, assessmentId]);

  async function submitAction(event: FormEvent<HTMLFormElement>, action: (form: FormData) => Promise<unknown>, successText: string) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await action(new FormData(formElement));
      formElement.reset();
      setRefreshVersion((version) => version + 1);
      setNotice(successText);
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setSubmitting(false);
    }
  }

  const headings: Record<string, { title: string; subtitle: string }> = {
    overview: { title: dashboard?.college_name || "College overview", subtitle: "Manage student outcomes, assessment activity, and departmental performance." },
    analytics: { title: "Skill analytics", subtitle: "Performance metrics calculated from this college's persisted assessments and roster." },
    students: { title: "Students", subtitle: "Roster and enrollment for your college." },
    departments: { title: "Departments", subtitle: "Organize students and assessment cohorts." },
    batches: { title: "Batches", subtitle: "Manage graduating cohorts within your departments." },
    assessments: { title: "Assessments", subtitle: "Create assessments and assign them to a department or batch." },
    results: { title: "Assessment results", subtitle: "View ranked results for assessments owned by your college." },
  };
  const heading = headings[view] || headings.overview;

  return (
    <DashboardLayout>
      <main className="space-y-6 pb-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-cyan-300">College operations</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{heading.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{heading.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className={buttonClass} href="/college/dashboard?view=students">Manage roster <ArrowRight size={15} /></a>
            <a className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-400/40" href="/college/dashboard?view=assessments">Create assessment</a>
          </div>
        </header>

        {error && <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200">{error}</div>}
        {notice && <div role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b1020] px-5 py-12 text-center text-sm text-slate-400">Loading college data…</div>
        ) : !dashboard ? (
          error ? null : <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 px-5 py-8 text-sm text-amber-100">College dashboard data is unavailable.</div>
        ) : (
          <>
            {(view === "overview" || view === "analytics") && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric label="Total students" value={dashboard.total_students} icon={Users} />
                  <Metric label="Active students" value={dashboard.active_students} note="Based on active student accounts" icon={Users} />
                  <Metric label="Departments" value={dashboard.total_departments} icon={Building2} />
                  <Metric label="Batches" value={dashboard.total_batches} icon={Layers3} />
                  <Metric label="Assessment participation" value={`${dashboard.assessment_participation_rate}%`} note="Unique students with a submission" icon={ClipboardCheck} />
                  <Metric label="Average performance" value={`${dashboard.average_performance_score}%`} icon={BarChart3} />
                  <Metric label="Pass rate" value={`${dashboard.pass_rate}%`} icon={ClipboardCheck} />
                  <Metric label="Upcoming assessments" value={dashboard.upcoming_assessments} icon={CalendarClock} />
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
                  <Panel title="Department performance" subtitle="Real assessment outcomes grouped by department.">
                    {dashboard.department_analytics.length === 0 ? <EmptyState>No department data is available yet.</EmptyState> : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-sm">
                          <thead className="text-xs uppercase text-slate-500"><tr><th className="pb-3 pr-4">Department</th><th className="pb-3 pr-4">Students</th><th className="pb-3 pr-4">Average</th><th className="pb-3">Pass rate</th></tr></thead>
                          <tbody className="divide-y divide-white/5">
                            {dashboard.department_analytics.map((department) => (
                              <tr key={department.department_name}>
                                <td className="py-3 pr-4 font-medium text-white">{department.department_name}</td>
                                <td className="py-3 pr-4 tabular-nums text-slate-300">{department.total_students}</td>
                                <td className="py-3 pr-4 tabular-nums text-slate-300">{department.avg_performance}%</td>
                                <td className="py-3 tabular-nums text-slate-300">{department.pass_rate}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Panel>
                  <Panel title="Student attention" subtitle="Students without a recorded assessment submission.">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-300" aria-hidden="true" />
                      <span className="text-3xl font-semibold tabular-nums text-white">{dashboard.students_needing_attention}</span>
                      <span className="text-sm text-slate-400">students</span>
                    </div>
                    <a className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-white" href="/college/dashboard?view=students">Open roster <ArrowRight size={14} /></a>
                  </Panel>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Panel title="Skill distribution" subtitle="Only populated when assessment results include skill-level evidence.">
                    {dashboard.skill_distribution.length === 0 ? <EmptyState>No skill-level distribution is provided by the current college assessment API.</EmptyState> : (
                      <div className="space-y-4">
                        {dashboard.skill_distribution.map((skill) => (
                          <div key={skill.skill}>
                            <div className="mb-1 flex justify-between text-sm"><span className="text-slate-200">{skill.skill}</span><span className="tabular-nums text-slate-400">{skill.average_score}%</span></div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${Math.max(0, Math.min(100, skill.average_score))}%` }} /></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Panel>
                  <Panel title="Placement readiness" subtitle="Placement-drive and eligibility APIs are not connected for colleges yet.">
                    <EmptyState>Readiness, eligible-student, shortlisted-student, and drive metrics are unavailable until those workflows are implemented in the backend.</EmptyState>
                  </Panel>
                </div>
              </>
            )}

            {view === "students" && (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <Panel title={`Student roster · ${students.length}`}>
                  {students.length === 0 ? <EmptyState>No students are linked to this college yet.</EmptyState> : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px] text-left text-sm">
                        <thead className="text-xs uppercase text-slate-500"><tr><th className="pb-3 pr-4">Student</th><th className="pb-3 pr-4">Email</th><th className="pb-3 pr-4">Department</th><th className="pb-3 pr-4">Batch</th><th className="pb-3">Roll no.</th></tr></thead>
                        <tbody className="divide-y divide-white/5">{students.map((student) => <tr key={student.id}><td className="py-3 pr-4 font-medium text-white">{student.full_name}</td><td className="py-3 pr-4 text-slate-300">{student.email}</td><td className="py-3 pr-4 text-slate-300">{student.department_name || "—"}</td><td className="py-3 pr-4 text-slate-300">{student.batch_name || "—"}</td><td className="py-3 text-slate-300">{student.roll_number || "—"}</td></tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </Panel>
                <Panel title="Add an existing student" subtitle="The student must already have a SkillBattle account.">
                  <form className="space-y-3" onSubmit={(event) => void submitAction(event, async (form) => organizationDashboardService.addCollegeStudent({
                    user_email_or_username: String(form.get("student") || ""),
                    department_id: form.get("department_id") ? Number(form.get("department_id")) : undefined,
                    batch_id: form.get("batch_id") ? Number(form.get("batch_id")) : undefined,
                    roll_number: String(form.get("roll_number") || ""),
                  }), "Student linked to the college.")}>
                    <label className="block text-xs font-medium text-slate-400" htmlFor="student-account">Student email or username</label>
                    <input id="student-account" name="student" required className={inputClass} placeholder="student@college.edu" />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="student-department">Department</label>
                    <select id="student-department" name="department_id" className={inputClass}><option value="">No department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>
                    <label className="block text-xs font-medium text-slate-400" htmlFor="student-batch">Batch</label>
                    <select id="student-batch" name="batch_id" className={inputClass}><option value="">No batch</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select>
                    <label className="block text-xs font-medium text-slate-400" htmlFor="student-roll">Roll number</label>
                    <input id="student-roll" name="roll_number" className={inputClass} placeholder="Optional" />
                    <button className={buttonClass} disabled={submitting}>{submitting ? "Adding…" : "Add student"}</button>
                  </form>
                </Panel>
              </div>
            )}

            {view === "departments" && (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <Panel title={`Departments · ${departments.length}`}>
                  {departments.length === 0 ? <EmptyState>No departments have been created.</EmptyState> : <div className="divide-y divide-white/5">{departments.map((department) => <div key={department.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium text-white">{department.name}</p><p className="mt-1 text-xs text-slate-400">Code {department.code}{department.head_name ? ` · ${department.head_name}` : ""}</p></div><span className="text-xs text-slate-500">{dashboard.department_analytics.find((item) => item.department_name === department.name)?.total_students ?? 0} students</span></div>)}</div>}
                </Panel>
                <Panel title="Create department">
                  <form className="space-y-3" onSubmit={(event) => void submitAction(event, (form) => organizationDashboardService.createDepartment({ name: String(form.get("name") || ""), code: String(form.get("code") || ""), head_name: String(form.get("head_name") || "") }), "Department created.")}>
                    <label className="block text-xs font-medium text-slate-400" htmlFor="department-name">Name</label><input id="department-name" name="name" required className={inputClass} placeholder="Computer Science" />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="department-code">Code</label><input id="department-code" name="code" required className={inputClass} placeholder="CSE" />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="department-head">Department head</label><input id="department-head" name="head_name" className={inputClass} placeholder="Optional" />
                    <button className={buttonClass} disabled={submitting}>{submitting ? "Creating…" : "Create department"}</button>
                  </form>
                </Panel>
              </div>
            )}

            {view === "batches" && (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <Panel title={`Batches · ${batches.length}`}>
                  {batches.length === 0 ? <EmptyState>No batches have been created.</EmptyState> : <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="pb-3 pr-4">Batch</th><th className="pb-3 pr-4">Department</th><th className="pb-3">Passout year</th></tr></thead><tbody className="divide-y divide-white/5">{batches.map((batch) => <tr key={batch.id}><td className="py-3 pr-4 font-medium text-white">{batch.name}</td><td className="py-3 pr-4 text-slate-300">{departments.find((item) => item.id === batch.department_id)?.name || "—"}</td><td className="py-3 tabular-nums text-slate-300">{batch.passout_year}</td></tr>)}</tbody></table></div>}
                </Panel>
                <Panel title="Create batch">
                  <form className="space-y-3" onSubmit={(event) => void submitAction(event, (form) => organizationDashboardService.createBatch({ name: String(form.get("name") || ""), passout_year: Number(form.get("passout_year")), department_id: form.get("department_id") ? Number(form.get("department_id")) : undefined }), "Batch created.")}>
                    <label className="block text-xs font-medium text-slate-400" htmlFor="batch-name">Batch name</label><input id="batch-name" name="name" required className={inputClass} placeholder="Batch 2026–2030" />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="batch-year">Passout year</label><input id="batch-year" name="passout_year" type="number" min="2000" max="2100" defaultValue="2027" required className={inputClass} />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="batch-department">Department</label><select id="batch-department" name="department_id" className={inputClass}><option value="">No department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>
                    <button className={buttonClass} disabled={submitting}>{submitting ? "Creating…" : "Create batch"}</button>
                  </form>
                </Panel>
              </div>
            )}

            {view === "assessments" && (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                <Panel title={`Assessments · ${assessments.length}`}>
                  {assessments.length === 0 ? <EmptyState>No assessments have been created yet.</EmptyState> : <div className="divide-y divide-white/5">{assessments.map((assessment) => <div key={assessment.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-medium text-white">{assessment.title}</p><p className="mt-1 text-xs text-slate-400">{assessment.assessment_type} · {assessment.questions_count} questions · {assessment.duration_minutes} min</p></div><span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-xs text-cyan-200">{assessment.status}</span></div>)}</div>}
                </Panel>
                <Panel title="Create and assign assessment" subtitle="One multiple-choice question is created with the assessment.">
                  <form className="space-y-3" onSubmit={(event) => void submitAction(event, (form) => {
                    const options = String(form.get("options") || "").split("\n").map((value) => value.trim()).filter(Boolean);
                    return organizationDashboardService.createCollegeAssessment({
                      department_id: form.get("department_id") ? Number(form.get("department_id")) : undefined,
                      batch_id: form.get("batch_id") ? Number(form.get("batch_id")) : undefined,
                      title: String(form.get("title") || ""),
                      description: String(form.get("description") || ""),
                      assessment_type: "MCQ",
                      duration_minutes: Number(form.get("duration") || 30),
                      pass_marks: 5,
                      total_marks: 10,
                      questions: [{ question_type: "MCQ", skill_category: String(form.get("skill") || "General"), question_text: String(form.get("question") || ""), options, correct_option: String(form.get("answer") || ""), marks: 10 }],
                    });
                  }, "Assessment created and assigned.")}>
                    <label className="block text-xs font-medium text-slate-400" htmlFor="assessment-title">Assessment title</label><input id="assessment-title" name="title" required className={inputClass} placeholder="Algorithms readiness" />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="assessment-description">Description</label><input id="assessment-description" name="description" className={inputClass} placeholder="Optional" />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="assessment-department">Assign department</label><select id="assessment-department" name="department_id" className={inputClass}><option value="">All college students</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>
                    <label className="block text-xs font-medium text-slate-400" htmlFor="assessment-batch">Assign batch</label><select id="assessment-batch" name="batch_id" className={inputClass}><option value="">All eligible students</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select>
                    <label className="block text-xs font-medium text-slate-400" htmlFor="assessment-skill">Skill category</label><input id="assessment-skill" name="skill" required className={inputClass} placeholder="Algorithms" />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="assessment-question">Question</label><textarea id="assessment-question" name="question" required rows={3} className={`${inputClass} h-auto py-3`} placeholder="Enter the question" />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="assessment-options">Options, one per line</label><textarea id="assessment-options" name="options" required rows={4} className={`${inputClass} h-auto py-3`} placeholder={"Option one\nOption two\nOption three\nOption four"} />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="assessment-answer">Correct option (exact text)</label><input id="assessment-answer" name="answer" required className={inputClass} />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="assessment-duration">Duration in minutes</label><input id="assessment-duration" name="duration" type="number" min="1" max="180" defaultValue="30" required className={inputClass} />
                    <button className={buttonClass} disabled={submitting}>{submitting ? "Creating…" : "Create assessment"}</button>
                  </form>
                </Panel>
              </div>
            )}

            {view === "results" && (
              <Panel title="Ranked assessment results">
                <label htmlFor="results-assessment" className="mb-2 block text-sm font-medium text-slate-300">Assessment</label>
                <select id="results-assessment" value={assessmentId} onChange={(event) => setAssessmentId(event.target.value)} className={`${inputClass} mb-5 max-w-xl`}>
                  <option value="">Choose an assessment</option>{assessments.map((assessment) => <option key={assessment.id} value={assessment.id}>{assessment.title}</option>)}
                </select>
                {!assessmentId ? <EmptyState>Select an assessment to load its results.</EmptyState> : results.length === 0 ? <EmptyState>No student submissions have been recorded for this assessment.</EmptyState> : (
                  <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="pb-3 pr-4">Rank</th><th className="pb-3 pr-4">Student</th><th className="pb-3 pr-4">Email</th><th className="pb-3 pr-4">Score</th><th className="pb-3 pr-4">Result</th><th className="pb-3">Submitted</th></tr></thead><tbody className="divide-y divide-white/5">{results.map((result) => <tr key={result.submission_id}><td className="py-3 pr-4 tabular-nums text-slate-400">{result.rank}</td><td className="py-3 pr-4 font-medium text-white">{result.student_name}</td><td className="py-3 pr-4 text-slate-300">{result.student_email}</td><td className="py-3 pr-4 tabular-nums text-slate-300">{result.percentage}%</td><td className="py-3 pr-4">{result.is_passed ? <span className="text-emerald-300">Passed</span> : <span className="text-amber-300">Needs review</span>}</td><td className="py-3 text-slate-400">{new Date(result.submitted_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>
                )}
              </Panel>
            )}
          </>
        )}
      </main>
    </DashboardLayout>
  );
}
