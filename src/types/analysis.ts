export interface AnalysisStatus {

    resume_id: string;

    status: string;

    progress: number;

    parsed: boolean;

    ai_processed: boolean;

    ats_score: number;

    placement_score: number;

}

export interface ResumeAnalysis {

    summary: string;

    strengths: string[];

    weaknesses: string[];

    missing_skills: string[];

    improvement_suggestions: string[];

    resume_score: number;

}