"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, CheckCircle2, Star, Trophy, Zap, AlertTriangle, ArrowRight, Award } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { campaignService, type CampaignLevelResponse, type LevelSubmitResponse } from "@/services/campaign.service";
import toast from "react-hot-toast";

interface PageProps {
  params: Promise<{
    track: string;
    levelId: string;
  }>;
}

export default function PlayLevelPage({ params }: PageProps) {
  const router = useRouter();
  const { track, levelId } = use(params);
  const parsedLevelId = parseInt(levelId);

  const [levelData, setLevelData] = useState<CampaignLevelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Track selected options
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LevelSubmitResponse | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await campaignService.getCampaignLevel(track, parsedLevelId);
        if (active) setLevelData(data);
      } catch (err: any) {
        toast.error("Failed to load level questions");
        router.push("/campaign");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [track, parsedLevelId, router]);

  if (loading || !levelData) {
    return (
      <DashboardLayout>
        <div className="flex h-[75vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <p className="mt-5 text-slate-400">Loading Assessment Node...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentQuestion = levelData.questions[currentIdx];
  const isLastQuestion = currentIdx === levelData.questions.length - 1;

  const handleSelectOption = (optIdx: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: optIdx,
    });
  };

  const handleNext = () => {
    if (selectedAnswers[currentQuestion.id] === undefined) {
      toast.error("Please select an answer to proceed!");
      return;
    }
    if (!isLastQuestion) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswers[currentQuestion.id] === undefined) {
      toast.error("Please select an answer to proceed!");
      return;
    }
    setSubmitting(true);
    try {
      const answersPayload = Object.entries(selectedAnswers).map(([qId, ansOpt]) => ({
        question_id: parseInt(qId),
        selected_option: ansOpt,
      }));

      const res = await campaignService.submitLevel({
        track,
        level_id: parsedLevelId,
        answers: answersPayload,
      });
      setResult(res);

      if (res.stars > 0) {
        toast.success("Level Cleared! 🎉");
      } else {
        toast.error("Failed to clear level. Try again!");
      }
    } catch (err: any) {
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        {/* Back navigation */}
        <button
          onClick={() => router.push("/campaign")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition"
        >
          <ChevronLeft size={16} /> Back to Map
        </button>

        {!result ? (
          <div className="space-y-6">
            {/* Header / Progress */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                  Track: {track.toUpperCase()} • Level {parsedLevelId}
                </span>
                <h1 className="text-2xl font-black text-white mt-1">{levelData.title}</h1>
              </div>
              <span className="rounded-xl bg-[#0D1226] border border-white/10 px-4 py-2 text-sm font-bold text-white">
                Q: {currentIdx + 1} / {levelData.questions.length}
              </span>
            </div>

            {/* Assessment Card */}
            <div className="rounded-3xl border border-white/10 bg-[#070B14]/80 p-8 backdrop-blur-xl space-y-8 shadow-xl shadow-black/30">
              <h3 className="text-xl font-bold text-white leading-relaxed">
                {currentQuestion.text}
              </h3>

              <div className="space-y-3.5">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left rounded-2xl border px-6 py-4.5 text-sm font-semibold transition duration-200 flex items-center justify-between ${
                        isSelected
                          ? "bg-gradient-to-r from-cyan-500/15 to-violet-500/15 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/5"
                          : "border-white/5 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10"
                      }`}
                    >
                      <span>{opt}</span>
                      <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-cyan-400 bg-cyan-500/20" : "border-slate-600"
                      }`}>
                        {isSelected && <div className="h-2 w-2 rounded-full bg-cyan-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation button */}
            <div className="flex justify-end">
              {isLastQuestion ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition duration-300 disabled:opacity-50"
                >
                  {submitting ? "Evaluating..." : "Submit Node"} <CheckCircle2 size={16} />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-xl bg-slate-800 border border-white/10 px-8 py-3.5 font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition duration-300"
                >
                  Next Question <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Victory / Defeat Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-white/10 bg-[#070B14]/80 p-8 backdrop-blur-xl text-center space-y-8 shadow-2xl relative overflow-hidden"
          >
            {result.stars > 0 && (
              <div className="absolute inset-0 bg-cyan-500/5 blur-3xl pointer-events-none" />
            )}

            <div className="space-y-4">
              <div className="mx-auto h-20 w-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
                {result.stars > 0 ? (
                  <Trophy size={40} className="text-yellow-400" />
                ) : (
                  <AlertTriangle size={40} className="text-red-500" />
                )}
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">
                {result.stars > 0 ? "Node Stabilized!" : "Connection Terminated"}
              </h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                {result.stars > 0
                  ? "Congratulations! You have successfully completed the node assessment."
                  : "You did not clear the assessment. Correct at least 1 question to pass!"}
              </p>
            </div>

            {/* Stars rendering */}
            <div className="flex gap-2 justify-center py-2">
              {[1, 2, 3].map((s) => (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: s * 0.2, type: "spring" }}
                  key={s}
                >
                  <Star
                    size={36}
                    className={s <= result.stars ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "text-slate-800"}
                  />
                </motion.div>
              ))}
            </div>

            {/* Score & CP details */}
            <div className="grid gap-4 sm:grid-cols-2 max-w-md mx-auto">
              <div className="rounded-2xl border border-white/5 bg-[#0D1226]/60 p-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Accuracy</span>
                <span className="text-xl font-black text-white mt-1">{result.score}%</span>
                <span className="text-xs text-slate-400 block mt-0.5">({result.correct_count} / {result.total} Correct)</span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#0D1226]/60 p-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Campaign Reward</span>
                <span className="text-xl font-black text-yellow-400 mt-1">+{result.points_earned} CP</span>
                <span className="text-xs text-slate-400 block mt-0.5">(+{result.stars * 100} XP Granted)</span>
              </div>
            </div>

            {/* Rank upgraded alert */}
            {result.rank_upgraded && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-md mx-auto rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-5 flex items-center gap-4 text-left shadow-lg shadow-fuchsia-500/5"
              >
                <div className="rounded-xl bg-fuchsia-500/20 p-2.5">
                  <Award size={24} className="text-fuchsia-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">Rank Promoted! 🚀</h4>
                  <p className="text-xs text-fuchsia-300 mt-0.5">
                    Your skills scaled! Your new rank is <strong className="uppercase">{result.new_rank}</strong>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <button
                onClick={() => router.push("/campaign")}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition duration-300"
              >
                Return to Campaign Map
              </button>
              {result.stars === 0 && (
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-xl border border-white/10 bg-slate-900 px-8 py-3.5 font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  Retry Node
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
