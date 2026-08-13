"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { careerService, ResumeData } from "@/services/career.service";
import { useUpload } from "@/hooks/useUpload";
import { toast } from "react-hot-toast";
import {
  FileText,
  Download,
  Save,
  Plus,
  Trash2,
  Award,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  SearchCheck,
  Upload,
  ArrowRight,
  Zap,
  Clock,
  Target,
} from "lucide-react";

type ResumePhase = "upload" | "analysis";

export default function CareerResumePage() {
  // Upload & Resume State
  const [phase, setPhase] = useState<ResumePhase>("upload");
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Loading & Processing
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { upload, uploading } = useUpload();

  // Analysis Report
  const [analysisReport, setAnalysisReport] = useState<any | null>(null);

  // Form States
  const [newSkill, setNewSkill] = useState("");
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");

  // Check existing resume on mount
  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const data = await careerService.getUserResume();
      if (data && data.full_name) {
        setResume(data);
        setPhase("analysis");
      } else {
        setPhase("upload");
      }
    } catch (err) {
      console.error("Failed to load resume:", err);
      setPhase("upload");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadResume = async () => {
    if (!file) {
      toast.error("Please select a resume file");
      return;
    }

    try {
      const result = await upload(file);
      if (result?.success) {
        toast.success("Resume uploaded successfully!");
        // Reload resume data
        await fetchResume();
        setFile(null);
      } else {
        toast.error(result?.message || "Failed to upload resume");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Error uploading resume");
    }
  };

  const handleSave = async () => {
    if (!resume) return;
    try {
      setSaving(true);
      const saved = await careerService.saveResume(resume);
      setResume(saved);
      toast.success("Resume saved successfully!");
    } catch (err) {
      console.error("Failed to save resume:", err);
      toast.error("Failed to save resume.");
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyzeATS = async () => {
    if (!resume) return;
    try {
      setAnalyzing(true);
      await new Promise((r) => setTimeout(r, 1500));

      let atsScore = 100;
      const issues: Array<{
        project_name: string;
        issue_type: string;
        problem_found: string;
        recommendation: string;
        suggested_rewrite: string;
      }> = [];
      const recommendations: string[] = [];

      if (!resume.github && !resume.linkedin) {
        atsScore -= 10;
        recommendations.push(
          "Add a GitHub or LinkedIn profile link to improve technical visibility."
        );
      }
      if (resume.skills.length < 5) {
        atsScore -= 15;
        recommendations.push(
          "List more technical skills. Aim for at least 8-10 relevant technologies."
        );
      }
      if (!resume.projects || resume.projects.length === 0) {
        atsScore -= 20;
        recommendations.push(
          "Include at least 2 strong software projects with measurable impacts."
        );
      } else {
        resume.projects.forEach((p) => {
          if (p.description.length < 50) {
            atsScore -= 5;
            issues.push({
              project_name: p.name,
              issue_type: "Weak Description",
              problem_found:
                "Description is too short and lacks measurable metrics.",
              recommendation:
                "Use the STAR method (Situation, Task, Action, Result).",
              suggested_rewrite:
                "Developed " +
                p.name +
                " resulting in 30% performance increase, serving 10k+ users.",
            });
          }
        });
      }

      const report = {
        ats_score: Math.max(atsScore, 30),
        placement_readiness_score: Math.max(atsScore - 5, 20),
        summary_verdict:
          atsScore >= 80
            ? "Your resume is well-optimized for ATS systems."
            : "Your resume requires structural improvements to pass ATS filters.",
        project_issues: issues,
        actionable_recommendations: recommendations,
      };

      setAnalysisReport(report);
      setResume((prev) =>
        prev
          ? {
              ...prev,
              ats_score: report.ats_score,
              placement_score: report.placement_readiness_score,
              ai_summary: report.summary_verdict,
            }
          : null
      );
      toast.success("ATS & Project Analysis Complete!");
    } catch (err) {
      console.error("Failed to analyze resume:", err);
      toast.error("Error analyzing resume.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim() || !resume) return;
    if (!resume.skills.includes(newSkill.trim())) {
      setResume({
        ...resume,
        skills: [...resume.skills, newSkill.trim()],
      });
    }
    setNewSkill("");
  };

  const handleRemoveSkill = (skill: string) => {
    if (!resume) return;
    setResume({
      ...resume,
      skills: resume.skills.filter((s) => s !== skill),
    });
  };

  const handleAddProject = () => {
    if (!newProjName.trim() || !resume) return;
    const newProj = {
      name: newProjName.trim(),
      description: newProjDesc.trim() || "Developed high-performance software application.",
      tech_stack: [],
    };
    setResume({
      ...resume,
      projects: [...(resume.projects || []), newProj],
    });
    setNewProjName("");
    setNewProjDesc("");
  };

  const handleRemoveProject = (idx: number) => {
    if (!resume) return;
    const updated = [...(resume.projects || [])];
    updated.splice(idx, 1);
    setResume({ ...resume, projects: updated });
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AnimatePresence mode="wait">
        {/* UPLOAD PHASE */}
        {phase === "upload" && (
          <motion.div
            key="upload-phase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-cyan-950/10 p-8 text-white shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-cyan-500/20 border border-cyan-500/30 p-4">
                  <FileText className="h-8 w-8 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-black">Resume Screening</h1>
                  <p className="mt-1 text-slate-400">
                    Upload your resume to begin ATS optimization and placement screening
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Upload Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border-2 border-dashed border-white/20 bg-gradient-to-br from-slate-950/50 to-violet-950/50 p-12 text-center hover:border-cyan-400/50 transition"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 p-6">
                  <Upload className="h-8 w-8 text-cyan-400" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Upload Your Resume
                  </h2>
                  <p className="mt-2 text-slate-400">
                    PDF, DOC, or DOCX format (Max 10MB)
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 w-full max-w-md">
                  <label className="flex flex-col items-center gap-3 cursor-pointer">
                    <div className="rounded-full bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition">
                      <FileText className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {file ? file.name : "Click to select file"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        or drag and drop
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <motion.button
                  onClick={handleUploadResume}
                  disabled={!file || uploading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-8 py-4 font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Upload className="h-5 w-5" />
                  {uploading ? "Uploading..." : "Upload Resume"}
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </div>
            </motion.div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: <Zap className="h-6 w-6" />,
                  title: "ATS Optimization",
                  desc: "We'll analyze your resume for ATS compatibility",
                  color: "from-yellow-500 to-orange-500",
                },
                {
                  icon: <Target className="h-6 w-6" />,
                  title: "Placement Screening",
                  desc: "Get your placement readiness score",
                  color: "from-cyan-500 to-blue-500",
                },
                {
                  icon: <Clock className="h-6 w-6" />,
                  title: "Instant Analysis",
                  desc: "Results in seconds with detailed insights",
                  color: "from-violet-500 to-pink-500",
                },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white hover:border-white/20 transition"
                >
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.color} p-2.5 text-white mb-3`}
                  >
                    {card.icon}
                  </div>
                  <h3 className="font-bold mb-1">{card.title}</h3>
                  <p className="text-sm text-slate-400">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ANALYSIS PHASE */}
        {phase === "analysis" && resume && (
          <motion.div
            key="analysis-phase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Top Banner */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
                  Resume Screening & ATS Optimization
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Enhance your resume for ATS systems and improve your placement
                  readiness with AI-powered insights.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <motion.button
                  onClick={handleAnalyzeATS}
                  disabled={analyzing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:opacity-90 transition disabled:opacity-50"
                >
                  <SearchCheck className="h-4 w-4" />
                  {analyzing ? "Auditing ATS..." : "Analyze ATS & Issues"}
                </motion.button>

                <motion.button
                  onClick={handleSave}
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Resume"}
                </motion.button>

                <motion.button
                  onClick={() => {
                    setPhase("upload");
                    setResume(null);
                    setFile(null);
                    setAnalysisReport(null);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 rounded-xl border-2 border-white/20 px-5 py-2.5 text-sm font-bold text-white hover:border-white/40 transition"
                >
                  <Upload className="h-4 w-4" />
                  Upload New
                </motion.button>
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex items-center gap-4 hover:border-emerald-500/60 transition"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 font-black text-2xl shadow-lg flex-shrink-0">
                  {resume.ats_score || 75}%
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm md:text-base">
                    ATS Score
                  </h4>
                  <p className="text-xs text-emerald-300 mt-0.5">
                    Corporate ATS optimized
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl border border-violet-500/30 bg-violet-500/10 p-6 flex items-center gap-4 hover:border-violet-500/60 transition"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500 text-white font-black text-2xl shadow-lg flex-shrink-0">
                  {resume.placement_score || 80}%
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm md:text-base">
                    Placement Score
                  </h4>
                  <p className="text-xs text-violet-300 mt-0.5">
                    Shortlist probability
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Analysis Report */}
            {analysisReport && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-amber-500/30 bg-slate-900/90 p-6 backdrop-blur-xl space-y-6 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-xl font-bold text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-amber-400" /> Project
                    Weaknesses & ATS Audit Report
                  </h3>
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-200">
                    {analysisReport.project_issues?.length || 0} Issues Detected
                  </span>
                </div>

                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                  {analysisReport.summary_verdict}
                </p>

                {/* Project Issues */}
                {analysisReport.project_issues?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      Detailed Project Problems & Suggested Rewrites
                    </h4>

                    <div className="grid gap-4 md:grid-cols-2">
                      {analysisReport.project_issues.map(
                        (item: any, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-rose-300 text-sm flex items-center gap-1.5">
                                <AlertCircle className="h-4 w-4 text-rose-400" />{" "}
                                {item.project_name}
                              </span>
                              <span className="rounded-lg bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300">
                                {item.issue_type}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed">
                              <strong className="text-white">Problem:</strong>{" "}
                              {item.problem_found}
                            </p>

                            <p className="text-xs text-amber-300 leading-relaxed">
                              <strong className="text-amber-200">Recommendation:</strong>{" "}
                              {item.recommendation}
                            </p>

                            <div className="rounded-xl bg-slate-950 p-3 font-mono text-xs text-emerald-300 border border-emerald-500/30">
                              <p className="text-[10px] font-sans font-bold text-slate-500 uppercase mb-1">
                                Suggested Rewrite:
                              </p>
                              {item.suggested_rewrite}
                            </div>
                          </motion.div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysisReport.actionable_recommendations?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      General Recommendations
                    </h4>
                    <div className="space-y-3">
                      {analysisReport.actionable_recommendations.map(
                        (rec: string, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/30"
                          >
                            <Lightbulb className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-300">{rec}</p>
                          </motion.div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Resume Details Editor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Basic Info */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl space-y-4">
                <h3 className="text-2xl font-bold">Basic Information</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={resume.full_name || ""}
                    onChange={(e) =>
                      setResume({ ...resume, full_name: e.target.value })
                    }
                    placeholder="Full Name"
                    className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  />

                  <input
                    value={resume.email || ""}
                    onChange={(e) =>
                      setResume({ ...resume, email: e.target.value })
                    }
                    placeholder="Email"
                    className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  />

                  <input
                    value={resume.phone || ""}
                    onChange={(e) =>
                      setResume({ ...resume, phone: e.target.value })
                    }
                    placeholder="Phone"
                    className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  />

                  <input
                    value={resume.location || ""}
                    onChange={(e) =>
                      setResume({ ...resume, location: e.target.value })
                    }
                    placeholder="Location"
                    className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  />

                  <input
                    value={resume.github || ""}
                    onChange={(e) =>
                      setResume({ ...resume, github: e.target.value })
                    }
                    placeholder="GitHub URL"
                    className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  />

                  <input
                    value={resume.linkedin || ""}
                    onChange={(e) =>
                      setResume({ ...resume, linkedin: e.target.value })
                    }
                    placeholder="LinkedIn URL"
                    className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Award className="h-6 w-6 text-cyan-400" /> Skills
                  </h3>
                  <span className="text-sm text-slate-400">
                    {resume.skills.length} skills
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill) => (
                    <motion.div
                      key={skill}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 px-4 py-2"
                    >
                      <span className="text-sm font-semibold text-cyan-300">
                        {skill}
                      </span>
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-cyan-400 hover:text-red-400 transition"
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleAddSkill()
                    }
                    placeholder="Add a skill..."
                    className="flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  />
                  <motion.button
                    onClick={handleAddSkill}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-bold text-white hover:opacity-90 transition"
                  >
                    <Plus className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              {/* Projects */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Briefcase className="h-6 w-6 text-violet-400" /> Projects
                  </h3>
                  <span className="text-sm text-slate-400">
                    {resume.projects?.length || 0} projects
                  </span>
                </div>

                <div className="space-y-4">
                  {resume.projects?.map((proj, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-lg text-cyan-300">
                          {proj.name}
                        </h4>
                        <button
                          onClick={() => handleRemoveProject(idx)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      <textarea
                        value={proj.description}
                        onChange={(e) => {
                          const updated = [...(resume.projects || [])];
                          updated[idx].description = e.target.value;
                          setResume({ ...resume, projects: updated });
                        }}
                        placeholder="Project description..."
                        className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                        rows={3}
                      />
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-3">
                  <input
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    placeholder="Project name..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  />
                  <textarea
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    placeholder="Project description..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                    rows={3}
                  />
                  <motion.button
                    onClick={handleAddProject}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 px-6 py-3 font-bold text-white shadow-lg shadow-violet-500/20 hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Add Project
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
