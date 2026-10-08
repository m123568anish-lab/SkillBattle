"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { careerService } from "@/services/career.service";
import { Bot, Send, Award, CheckCircle2, Play, Sparkles, Trophy } from "lucide-react";

export default function AIMockInterviewPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [company, setCompany] = useState("Google");
  const [role, setRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("Medium");
  const [interviewType, setInterviewType] = useState("Technical");

  const fetchSessions = async () => {
    try {
      const data = await careerService.getUserInterviews();
      setSessions(data ?? []);
      if (data?.length) {
        setActiveSession(data[0]);
        setCurrentQIndex(0);
      }
    } catch (error) {
      console.error("Failed to load interview sessions:", error);
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
      const newSession = await careerService.startInterview(company, role, difficulty, interviewType);
      setSessions((previous) => [newSession, ...previous]);
      setActiveSession(newSession);
      setCurrentQIndex(0);
      setFeedback(null);
      setUserAnswer("");
    } catch (error) {
      console.error("Error starting interview:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!activeSession || !userAnswer.trim()) return;

    const currentQ = activeSession.questions?.[currentQIndex];
    if (!currentQ) return;

    try {
      setSubmitting(true);
      const result = await careerService.submitInterviewAnswer(currentQ.id, userAnswer);
      setFeedback(result);
      setUserAnswer("");

      if (result?.session_completed) {
        const refreshed = await careerService.getUserInterviews();
        setSessions(refreshed ?? []);
        if (refreshed?.length) {
          setActiveSession(refreshed[0]);
        }
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishSession = async () => {
    if (!activeSession) return;
    try {
      const result = await careerService.completeInterview(activeSession.id);
      const refreshed = await careerService.getUserInterviews();
      setSessions(refreshed ?? []);
      if (refreshed?.length) {
        setActiveSession(refreshed[0]);
      }
      setFeedback({
        score: result.overall_score ?? 0,
        feedback: `Session completed. Performance rating: ${result.performance_rating ?? "Needs Improvement"}`,
        xp_earned: 0,
      });
    } catch (error) {
      console.error("Error completing interview:", error);
    }
  };

  const currentQ = activeSession?.questions?.[currentQIndex];
  const sessionProgress = activeSession ? ((currentQIndex + 1) / Math.max(activeSession.questions.length, 1)) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
            🎙️ AI Mock Interview Room
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Simulate realistic technical and system design rounds with instant AI feedback and placement-level scoring.
          </p>
        </div>

        <button
          onClick={handleStartInterview}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-60"
        >
          <Play className="h-4 w-4" /> Start New Session
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-violet-400" /> Interview Setup
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Company Target</label>
              <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none">
                <option value="Google">Google</option>
                <option value="Meta">Meta</option>
                <option value="Amazon">Amazon</option>
                <option value="Microsoft">Microsoft</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Interview Type</label>
              <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none">
                <option value="Technical">Technical</option>
                <option value="System Design">System Design</option>
                <option value="Behavioral">Behavioral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Target Role</label>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <button onClick={handleStartInterview} className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition">
              Launch Interview Session
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Recent sessions</h3>
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <p className="text-sm text-slate-400">No interviews yet. Start a new mock round to begin.</p>
              ) : (
                sessions.slice(0, 4).map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => {
                      setActiveSession(session);
                      setCurrentQIndex(0);
                      setFeedback(null);
                      setUserAnswer("");
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left transition hover:border-violet-500/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">{session.company}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-200">{session.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{session.role} · {session.difficulty}</p>
                    <p className="mt-2 text-xs text-violet-200">Score: {session.overall_score ?? 0}/100</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!activeSession ? (
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center backdrop-blur-xl">
              <Bot className="mx-auto h-16 w-16 text-violet-400 mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold text-white">AI Interview Room Idle</h2>
              <p className="mt-2 text-slate-400 max-w-md mx-auto">
                Configure your target role and launch a realistic mock interview session.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-8 backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{activeSession.company} AI Interviewer</h3>
                    <p className="text-xs text-slate-400">{activeSession.role} • Question {Math.min(currentQIndex + 1, activeSession.questions.length || 1)} of {activeSession.questions.length || 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-200">
                  <Trophy className="h-3.5 w-3.5" /> {activeSession.overall_score ?? 0}/100
                </div>
              </div>

              <div className="h-2 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${Math.max(8, Math.min(100, sessionProgress))}%` }} />
              </div>

              {currentQ && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6">
                    <span className="rounded-lg bg-violet-500/20 px-2.5 py-1 text-xs font-bold text-violet-300">
                      Expected Topics: {currentQ.expected_topics}
                    </span>
                    <h4 className="mt-3 text-xl font-bold text-white leading-relaxed">{currentQ.question}</h4>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Your Answer / Code Explanation</label>
                    <textarea
                      rows={6}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Explain the trade-offs, algorithm, complexity, and edge cases..."
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-white focus:border-violet-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      onClick={() => { setCurrentQIndex((idx) => Math.min(idx + 1, (activeSession.questions.length || 1) - 1)); setFeedback(null); setUserAnswer(""); }}
                      disabled={currentQIndex >= (activeSession.questions.length || 1) - 1}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 font-bold text-white transition hover:border-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next Question
                    </button>
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={submitting || !userAnswer.trim()}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" /> {submitting ? "Evaluating..." : "Submit Answer"}
                    </button>
                    <button
                      onClick={handleFinishSession}
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 font-bold text-emerald-200 hover:bg-emerald-500/15 transition"
                    >
                      Finish Session
                    </button>
                  </div>

                  {feedback && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-bold text-emerald-400">
                          <CheckCircle2 className="h-5 w-5" /> AI Score: {Number(feedback.score ?? activeSession.overall_score ?? 0)}/100
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-violet-400 bg-violet-500/20 px-3 py-1 rounded-full">
                          <Award className="h-3.5 w-3.5" /> +{feedback.xp_earned ?? 0} XP
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{feedback.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
