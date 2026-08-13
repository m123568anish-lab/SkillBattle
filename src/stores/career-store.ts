import { create } from "zustand";

import { AnalysisStatus, ResumeAnalysis } from "@/types/analysis";

import { Resume } from "@/types/resume";

interface CareerStore {

    resumes: Resume[];

    currentResume: Resume | null;

    analysis: AnalysisStatus | ResumeAnalysis | null;

    setResumes: (data: Resume[]) => void;

    setCurrentResume: (resume: Resume | null) => void;

    setAnalysis: (analysis: AnalysisStatus | ResumeAnalysis | null) => void;

}

export const useCareerStore = create<CareerStore>((set) => ({

    resumes: [],

    currentResume: null,

    analysis: null,

    setResumes: (resumes) => set({ resumes }),

    setCurrentResume: (currentResume) => set({ currentResume }),

    setAnalysis: (analysis) => set({ analysis }),

}));