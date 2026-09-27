"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { careerService } from "@/services/career.service";
import { Bot, Send, Award, Sparkles, CheckCircle2, MessageSquare, Play, RefreshCw, ChevronRight, CheckCircle, Clock, Trophy, BarChart3 } from "lucide-react";

export default function AIMockInterviewPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);

  const [company, setCompany] = useState("Google");
  const [role, setRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("Medium");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await careerService.getUserInterviews();
      setSessions(data);
      if (data.length > 0 && !activeSession) {
        setActiveSession(data[0]);
      }
    } catch (err) {
      console.error("Failed to load interview sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    try {
      setLoading(true);
      setShowReport(false);
      setReportData(null);
      const newSession = await careerService.startInterview(company, role, difficulty);
      setSessions([newSession, ...sessions]);
      setActiveSession(newSession);
      setCurrentQIndex(0);
      setFeedback(null);
      setUserAnswer("");
    } catch (err) {
      console.error("Error starting interview:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!activeSession || !userAnswer.trim()) return;
    const currentQ = activeSession.questions[currentQIndex];
    try {
      setSubmitting(true);
      const res = await careerService.submitInterviewAnswer(currentQ.id, userAnswer);
      setFeedback(res);
      
      // Update session in local state with the answer
      const updatedQuestions = [...activeSession.questions];
      updatedQuestions[currentQIndex] = {
        ...currentQ,
        answers: [{ answer: userAnswer, feedback: res.feedback, score: res.score }]
      };
      setActiveSession({ ...activeSession, questions: updatedQuestions });

      if (res.session_completed) {
        handleFinishInterview(activeSession.id);
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishInterview = async (sessionId: number) => {
    try {
      setSubmitting(true);
      const report = await careerService.completeInterview(sessionId);
      setReportData(report);
      setShowReport(true);
      fetchSessions();
    } catch (err) {
      console.error("Error completing interview:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = activeSession?.questions?.[currentQIndex];
  const isLastQuestion = activeSession?.questions && currentQIndex === activeSession.questions.length - 1;

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
            🎙️ AI Mock Interview Room
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Simulate realistic technical and system design rounds with instant AI evaluation scoring and feedback.
          </p>
        </div>

        <button
          onClick={handleStartInterview}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
        >
          <Play className="h-4 w-4" /> Start New Session
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Interviewer Setup & Past Sessions */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-violet-400" /> Interview Setup
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Company Target</label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="Google">Google</option>
                <option value="Meta">Meta</option>
                <option value="Amazon">Amazon</option>
                <option value="Microsoft">Microsoft</option>
                <option value="Apple">Apple</option>
                <option value="Uber">Uber</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Target Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <button
              onClick={handleStartInterview}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
            >
              Launch Interview Session
            </button>
          </div>

          {/* Past Sessions List */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-400" /> Past Sessions</span>
              <span className="text-xs text-slate-500">{sessions.length} total</span>
            </h3>

            {sessions.length === 0 ? (
              <p className="text-xs text-slate-500">No mock interview sessions recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {sessions.map((sess) => (
                  <button
                    key={sess.id}
                    onClick={() => {
                      setActiveSession(sess);
                      setCurrentQIndex(0);
                      setFeedback(null);
                      setUserAnswer("");
                      setShowReport(sess.status === "COMPLETED");
                      if (sess.status === "COMPLETED") {
                        setReportData({
                          overall_score: sess.overall_score,
                          performance_rating: sess.overall_score >= 80 ? "Exceeds Expectations (Strong Hire)" : (sess.overall_score >= 60 ? "Meets Expectations (Hire)" : "Needs Improvement"),
                          total_questions: sess.total_questions,
                          questions_answered: sess.questions?.filter((q: any) => q.answers?.length > 0).length || 0
                        });
                      }
                    }}
                    className={`w-full text-left rounded-xl p-3 border text-xs transition flex items-center justify-between ${
                      activeSession?.id === sess.id
                        ? "border-violet-500/50 bg-violet-500/10 text-white"
                        : "border-white/5 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-200">{sess.company} - {sess.role}</div>
                      <div className="text-[10px] text-slate-500">{new Date(sess.started_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${sess.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                        {sess.status === "COMPLETED" ? `${sess.overall_score}/100` : "IN PROGRESS"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live AI Interview Room */}
        <div className="lg:col-span-2 space-y-6">
          {!activeSession ? (
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center backdrop-blur-xl">
              <Bot className="mx-auto h-16 w-16 text-violet-400 mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold text-white">AI Interview Room Ready</h2>
              <p className="mt-2 text-slate-400 max-w-md mx-auto">
                Configure your target company and role on the left panel, then launch your mock interview.
              </p>
            </div>
          ) : showReport && reportData ? (
            /* Final Report Card View */
            <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/60 p-8 backdrop-blur-xl space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl">{activeSession.company} Interview Evaluation Report</h3>
                    <p className="text-xs text-slate-400">{activeSession.role} • Completed Session</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-1.5 text-xs font-bold text-emerald-400">
                  COMPLETED
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-5 space-y-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Overall Performance Score</span>
                  <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                    {reportData.overall_score} / 100
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-5 space-y-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Hiring Recommendation</span>
                  <div className="text-lg font-bold text-emerald-400">
                    {reportData.performance_rating}
                  </div>
                </div>
              </div>

              {/* Question breakdown list */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-300">Question Evaluation Summary:</h4>
                {activeSession.questions?.map((q: any, idx: number) => {
                  const ans = q.answers?.[0];
                  return (
                    <div key={q.id} className="rounded-xl border border-white/5 bg-slate-800/30 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>Q{idx + 1}: {q.question.slice(0, 80)}...</span>
                        <span className={ans ? "text-emerald-400" : "text-slate-500"}>
                          {ans ? `Score: ${ans.score}/100` : "Not Answered"}
                        </span>
                      </div>
                      {ans?.feedback && (
                        <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-white/5">
                          {ans.feedback}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowReport(false)}
                  className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
                >
                  Review Questions
                </button>
                <button
                  onClick={handleStartInterview}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
                >
                  Start New Session
                </button>
              </div>
            </div>
          ) : (
            /* Active Live Interview Room View */
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-8 backdrop-blur-xl space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{activeSession.company} AI Interviewer</h3>
                    <p className="text-xs text-slate-400">{activeSession.role} • Question {currentQIndex + 1} of {activeSession.questions?.length || 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeSession.questions?.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentQIndex(idx);
                        const existingAns = activeSession.questions[idx]?.answers?.[0];
                        setUserAnswer(existingAns?.answer || "");
                        setFeedback(existingAns ? { score: existingAns.score, feedback: existingAns.feedback, xp_earned: 0 } : null);
                      }}
                      className={`h-8 w-8 rounded-lg font-bold text-xs transition ${
                        currentQIndex === idx ? "bg-violet-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Card */}
              {currentQ && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6">
                    <span className="rounded-lg bg-violet-500/20 px-2.5 py-1 text-xs font-bold text-violet-300">
                      Expected Topics: {currentQ.expected_topics}
                    </span>
                    <h4 className="mt-3 text-xl font-bold text-white leading-relaxed">{currentQ.question}</h4>
                  </div>

                  {/* Answer Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Your Answer / Code Explanation</label>
                    <textarea
                      rows={6}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your structured answer here. Include algorithms, data structures, complexity analysis, and edge cases..."
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-white focus:border-violet-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleFinishInterview(activeSession.id)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition"
                    >
                      Finish & View Report
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={submitting || !userAnswer.trim()}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" /> {submitting ? "Evaluating..." : "Submit Answer for AI Review"}
                      </button>

                      {feedback && !isLastQuestion && (
                        <button
                          onClick={() => {
                            const nextIdx = currentQIndex + 1;
                            setCurrentQIndex(nextIdx);
                            const nextAns = activeSession.questions[nextIdx]?.answers?.[0];
                            setUserAnswer(nextAns?.answer || "");
                            setFeedback(nextAns ? { score: nextAns.score, feedback: nextAns.feedback, xp_earned: 0 } : null);
                          }}
                          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 hover:opacity-90 transition"
                        >
                          Next Question <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Feedback Card */}
                  {feedback && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-bold text-emerald-400">
                          <CheckCircle2 className="h-5 w-5" /> AI Score: {feedback.score}/100
                        </span>
                        {feedback.xp_earned > 0 && (
                          <span className="flex items-center gap-1 text-xs font-bold text-violet-400 bg-violet-500/20 px-3 py-1 rounded-full">
                            <Award className="h-3.5 w-3.5" /> +{feedback.xp_earned} XP
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{feedback.feedback}</p>
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

