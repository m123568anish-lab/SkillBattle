"use client";

import { useEffect, useState, Suspense } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Breadcrumbs } from "@/components/arena";
import { careerService } from "@/services/career.service";
import {
  Bot,
  Send,
  Award,
  CheckCircle2,
  Play,
  Sparkles,
  Trophy,
  Briefcase,
  Building2,
  Code2,
  Clock,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface InterviewSession {
  id: string | number;
  company?: string;
  role?: string;
  difficulty?: string;
  interview_type?: string;
  questions?: Array<{
    id?: number;
    question: string;
    topic?: string;
  }>;
  status?: string;
  score?: number;
}

function InterviewPracticeInner() {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    score?: number;
    feedback?: string;
    strengths?: string[];
    improvements?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [company, setCompany] = useState("Google");
  const [role, setRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("Medium");
  const [interviewType, setInterviewType] = useState("Technical");

  const fetchSessions = async () => {
    try {
      const data = await careerService.getUserInterviews();
      setSessions((data as InterviewSession[]) ?? []);
      if (data?.length) {
        setActiveSession(data[0] as InterviewSession);
        setCurrentQIndex(0);
      }
    } catch (err) {
      console.error("Failed to load interview sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSessions();
  }, []);

  const handleStartInterview = async () => {
    try {
      setLoading(true);
      setError("");
      const newSession = await careerService.startInterview(company, role, difficulty, interviewType);
      const sessionObj = newSession as InterviewSession;
      setSessions((previous) => [sessionObj, ...previous]);
      setActiveSession(sessionObj);
      setCurrentQIndex(0);
      setFeedback(null);
      setUserAnswer("");
    } catch (err) {
      console.error("Error starting interview:", err);
      setError("Unable to start interview session right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!activeSession || !userAnswer.trim()) return;
    try {
      setSubmitting(true);
      setError("");
      const qId = currentQuestion?.id ?? (currentQIndex + 1);
      const res = await careerService.submitInterviewAnswer(qId, userAnswer);
      setFeedback(res);
    } catch (err) {
      console.error("Error submitting answer:", err);
      setError("Failed to evaluate answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (!activeSession?.questions) return;
    if (currentQIndex < activeSession.questions.length - 1) {
      setCurrentQIndex((idx) => idx + 1);
      setUserAnswer("");
      setFeedback(null);
    }
  };

  const currentQuestion = activeSession?.questions?.[currentQIndex];

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl space-y-7 p-4 sm:p-7">
        <Breadcrumbs
          items={[
            { label: "Practice Hub", href: "/practice" },
            { label: "Interview Preparation", href: "/practice/interview", active: true },
          ]}
        />

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0E1524] via-[#0B0F17] to-[#141C2E] p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Briefcase className="h-3.5 w-3.5 text-cyan-400" />
                <span>AI Technical Interview Coach</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Interview Preparation
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-slate-300">
                Simulate realistic FAANG and top-tier startup technical interviews with instant AI evaluation, scoring rubrics, and feedback on communication clarity.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">AI Evaluator</div>
                <div className="text-xs text-slate-400">STAR method & complexity feedback</div>
              </div>
            </div>
          </div>
        </section>

        {/* Interview Configuration */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Configure Interview Simulation</h2>
            <p className="text-xs text-slate-400">Select target company, engineering level, and interview focus</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Company</label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0B0F17] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
              >
                <option value="Google">Google</option>
                <option value="Amazon">Amazon</option>
                <option value="Microsoft">Microsoft</option>
                <option value="Meta">Meta</option>
                <option value="Netflix">Netflix</option>
                <option value="Stripe">Stripe</option>
                <option value="Uber">Uber</option>
                <option value="General">General Tier 1 Tech</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Role / Specialization</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0B0F17] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
              >
                <option value="Software Engineer">Software Engineer (General)</option>
                <option value="Frontend Engineer">Frontend Engineer (React/TS)</option>
                <option value="Backend Engineer">Backend Engineer (Distributed)</option>
                <option value="System Architect">System Architect / Staff</option>
                <option value="ML Engineer">Machine Learning Engineer</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0B0F17] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
              >
                <option value="Easy">Junior / New Grad</option>
                <option value="Medium">Mid-Level (SDE II)</option>
                <option value="Hard">Senior / Staff</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Format</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0B0F17] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
              >
                <option value="Technical">Technical & Algorithm</option>
                <option value="System Design">System Architecture</option>
                <option value="Behavioral">Behavioral / Leadership</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleStartInterview}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>{loading ? "Initializing..." : "Start Mock Interview"}</span>
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Active Simulation Session */}
        {activeSession ? (
          <section className="space-y-6 rounded-2xl border border-white/[0.08] bg-[#0E1524] p-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  {activeSession.company} • {activeSession.role}
                </span>
                <h3 className="text-lg font-bold text-white">
                  Question {currentQIndex + 1}
                  {activeSession.questions && ` of ${activeSession.questions.length}`}
                </h3>
              </div>
              <div className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-mono text-slate-300">
                {activeSession.interview_type || "Technical"}
              </div>
            </div>

            {/* Question Text */}
            <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-5">
              <p className="text-base font-semibold text-slate-100 leading-relaxed">
                {currentQuestion?.question || "Describe your approach to designing a real-time rate limiter for high-throughput distributed microservices. What trade-offs do you consider between token bucket and sliding window logs?"}
              </p>
            </div>

            {/* Answer Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Code2 className="h-4 w-4 text-cyan-400" />
                <span>Your Response (Structure: Requirements, Architecture, Trade-offs, Edge Cases)</span>
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your structured technical answer or algorithmic solution here..."
                rows={7}
                className="w-full rounded-xl border border-white/10 bg-[#0B0F17] p-4 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500 placeholder:text-slate-600 leading-relaxed"
              />
            </div>

            {/* Submission Action */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {userAnswer.length} characters typed
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={submitting || !userAnswer.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submitting ? "Analyzing Answer..." : "Submit Answer"}</span>
                </button>
                {feedback && activeSession.questions && currentQIndex < activeSession.questions.length - 1 && (
                  <button
                    type="button"
                    onClick={nextQuestion}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* AI Feedback Card */}
            {feedback && (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    <span>AI Evaluator Feedback</span>
                  </div>
                  {feedback.score !== undefined && (
                    <div className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-black text-cyan-300">
                      Score: {feedback.score} / 100
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {feedback.feedback || "Good conceptual breakdown. You accurately noted the trade-offs between memory overhead and precision in distributed sliding window algorithms."}
                </p>
              </div>
            )}
          </section>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-12 text-center text-slate-400">
            <Building2 className="h-10 w-10 mx-auto text-slate-500 mb-3" />
            <h3 className="text-base font-semibold text-white">No active interview session</h3>
            <p className="text-xs text-slate-400 mt-1">Select your target company and click &quot;Start Mock Interview&quot; above.</p>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}

export default function InterviewPracticePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F]" />}>
      <InterviewPracticeInner />
    </Suspense>
  );
}
