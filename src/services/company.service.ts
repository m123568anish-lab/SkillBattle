import api from "./api";

export interface Company {
  id: number;
  name: string;
  slug: string;
  industry?: string;
  website?: string;
  headquarters?: string;
  status: string;
}

export interface JobPosting {
  id: number;
  company_id: number;
  title: string;
  location?: string;
  employment_type?: string;
  remote_allowed?: boolean;
  description?: string;
  required_skills: string;
  compensation?: string;
  status: string;
  assessment_config_id?: string | number | null;
}

export interface CompanyDashboard {
  company: Company;
  jobs_total: number;
  active_jobs: number;
  candidates_total: number;
  shortlisted_total: number;
  recent_applications: Array<{ candidate: string; job: string; score: number; status: string }>;
}

export interface SkillActivity {
  source: string;
  title: string;
  score: number;
  completed_at?: string | null;
}

export interface SkillProfile {
  skills: Array<{ skill: string; score: number; attempts: number; sources: string[]; verified: boolean }>;
  practice_performance: SkillActivity[];
  battle_performance: SkillActivity[];
  assessment_performance: SkillActivity[];
  interview_results: SkillActivity[];
  achievements: Array<{ title: string; description: string; earned_at?: string | null }>;
}

export interface CandidatePrivacySettings {
  user_id: string;
  share_contact_info: boolean;
  share_skill_profile: boolean;
  share_assessment_results: boolean;
  allow_recruiter_search: boolean;
}

export interface JobOpening {
  job_id: number;
  company_id: number;
  company_name: string;
  title: string;
  location: string;
  employment_type: string;
  remote_allowed: boolean;
  description: string;
  required_skills: string;
  assessment_available: boolean;
}

export interface CandidateApplication {
  application_id: number;
  job_id: number;
  company_name: string;
  job_title: string;
  status: string;
  consent_to_recruiters: boolean;
  assessment_config_id: string | null;
  assessment_status: string;
}

export interface CompanyCandidate {
  application_id: number;
  job_id: number;
  job_title: string;
  candidate_id: string | null;
  candidate_name: string;
  candidate_email: string;
  status: string;
  score: number;
  consent: boolean;
  eligible: boolean;
  skill_profile: SkillProfile | null;
  assessment_status: string;
  assessment_score: number | null;
  target_company: string;
  github: string;
  linkedin: string;
}

export interface AssessmentSection {
  title: string;
  question_type: "mcq" | "coding" | "debugging" | "technical";
  skill_category?: string;
  question_count: number;
  weight: number;
  duration_minutes: number;
  negative_marking?: boolean;
}

export const companyService = {
  async registerCompany(data: any): Promise<Company> {
    const res = await api.post<Company>("/company/register", data);
    return res.data;
  },

  async getMyCompany(): Promise<Company | null> {
    const res = await api.get<Company | null>("/company/me");
    return res.data;
  },

  async getCompanyDashboard(): Promise<CompanyDashboard> {
    const res = await api.get<CompanyDashboard>("/company/dashboard");
    return res.data;
  },

  async createJob(data: any): Promise<JobPosting> {
    const res = await api.post<JobPosting>("/company/jobs", data);
    return res.data;
  },

  async listJobs(): Promise<JobPosting[]> {
    const res = await api.get<JobPosting[]>("/company/jobs");
    return res.data;
  },

  async listCandidates(jobId?: number): Promise<any[]> {
    const params = jobId ? { job_id: jobId } : {};
    const res = await api.get<any[]>("/company/candidates", { params });
    return res.data;
  },

  async createJobAssessment(jobId: number, data: {
    title: string;
    description?: string;
    difficulty?: string;
    duration_minutes: number;
    question_count: number;
    sections: AssessmentSection[];
    allowed_languages?: string[];
    negative_marking?: boolean;
  }): Promise<{ id: string; title: string; job_id: number; company_id: number; visibility: string }> {
    const res = await api.post(`/company/jobs/${jobId}/assessment`, data);
    return res.data;
  },

  async discoverCandidates(jobId: number): Promise<Array<{
    candidate_id: string | null;
    candidate_name: string;
    candidate_email: string;
    job_id: number;
    job_title: string;
    eligible: boolean;
    skill_profile: SkillProfile;
  }>> {
    const res = await api.get("/company/discover", { params: { job_id: jobId } });
    return res.data;
  },

  async updateApplicationStatus(applicationId: number, status: "shortlisted" | "rejected" | "applied") {
    const res = await api.patch(`/company/applications/${applicationId}/status`, { status });
    return res.data;
  },

  async listOpenings(): Promise<JobOpening[]> {
    const res = await api.get<JobOpening[]>("/company/openings");
    return res.data;
  },

  async apply(jobId: number, consentToRecruiters: boolean) {
    const res = await api.post("/company/applications", {
      job_id: jobId,
      consent_to_recruiters: consentToRecruiters,
    });
    return res.data;
  },

  async listMyApplications(): Promise<CandidateApplication[]> {
    const res = await api.get<CandidateApplication[]>("/company/my-applications");
    return res.data;
  },

  async updateApplicationConsent(applicationId: number, consentToRecruiters: boolean) {
    const res = await api.put(`/company/my-applications/${applicationId}/consent`, {
      consent_to_recruiters: consentToRecruiters,
    });
    return res.data;
  },

  async startApplicationAssessment(applicationId: number) {
    const res = await api.post<{ id: string }>(`/company/my-applications/${applicationId}/assessment/start`);
    return res.data;
  },

  async getSkillProfile(): Promise<SkillProfile> {
    const res = await api.get<SkillProfile>("/profile/skill-profile");
    return res.data;
  },

  async getSharingSettings(): Promise<CandidatePrivacySettings> {
    const res = await api.get<CandidatePrivacySettings>("/profile/sharing-settings");
    return res.data;
  },

  async updateSharingSettings(
    settings: Omit<CandidatePrivacySettings, "user_id">,
  ): Promise<CandidatePrivacySettings> {
    const res = await api.put<CandidatePrivacySettings>("/profile/sharing-settings", settings);
    return res.data;
  },
};
