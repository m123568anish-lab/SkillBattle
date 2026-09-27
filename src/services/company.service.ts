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
  required_skills?: string[];
  compensation?: string;
  status: string;
}

export interface CompanyDashboard {
  company_name: string;
  active_jobs: number;
  total_candidates: number;
  shortlisted_candidates: number;
  assessments_conducted: number;
  pipeline_stages: Array<{ stage: string; count: number; pct: number }>;
  recent_candidates: Array<{ name: string; role: string; score: number; status: string }>;
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
};
