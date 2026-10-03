import { api } from "@/lib/api";

export interface CollegeDashboardData {
  college_name: string;
  total_students: number;
  active_students: number;
  total_departments: number;
  total_batches: number;
  students_needing_attention: number;
  upcoming_assessments: number;
  assessment_participation_rate: number;
  average_performance_score: number;
  pass_rate: number;
  skill_distribution: Array<{ skill: string; average_score: number }>;
  weak_areas: string[];
  department_analytics: Array<{
    department_name: string;
    total_students: number;
    avg_performance: number;
    pass_rate: number;
  }>;
  placement_prep_progress: number | null;
}

export interface CollegeDepartment {
  id: number;
  college_id: number;
  name: string;
  code: string;
  head_name: string;
  created_at: string;
}

export interface CollegeBatch {
  id: number;
  college_id: number;
  department_id: number | null;
  name: string;
  passout_year: number;
  created_at: string;
}

export interface CollegeStudent {
  id: number;
  college_id: number;
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  roll_number: string;
  department_name: string | null;
  batch_name: string | null;
  joined_at: string;
}

export interface CollegeAssessment {
  id: number;
  college_id: number;
  department_id: number | null;
  batch_id: number | null;
  title: string;
  assessment_type: string;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  status: string;
  pass_marks: number;
  total_marks: number;
  created_at: string;
  questions_count: number;
}

export interface CollegeAssessmentResult {
  rank: number;
  submission_id: number;
  student_id: string;
  student_name: string;
  student_email: string;
  mcq_score: number;
  coding_score: number;
  total_score: number;
  percentage: number;
  is_passed: boolean;
  submitted_at: string;
}

export interface CompanyDashboardData {
  company: {
    id: number;
    name: string;
    slug: string;
    industry: string;
    website: string;
    headquarters: string;
    status: string;
  };
  jobs_total: number;
  active_jobs: number;
  candidates_total: number;
  shortlisted_total: number;
  assessment_completed: number;
  application_pipeline: Array<{ status: string; count: number }>;
  candidate_skill_distribution: Array<{ skill: string; count: number }>;
  job_performance: Array<{
    job_id: number;
    title: string;
    applications: number;
    shortlisted: number;
  }>;
  recent_applications: Array<{
    candidate: string;
    job: string;
    status: string;
    score: number;
  }>;
}

export interface CompanyJob {
  id: number;
  company_id: number;
  title: string;
  location: string;
  employment_type: string;
  remote_allowed: boolean;
  description: string;
  required_skills: string;
  compensation: string;
  status: string;
  assessment_config_id?: string | null;
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
  skill_profile: { skills: Array<{ skill: string; score: number; attempts: number }> } | null;
  assessment_status: string;
  assessment_score: number | null;
}

export interface DiscoverableCandidate {
  candidate_id: string | null;
  candidate_name: string;
  candidate_email: string;
  job_id: number;
  job_title: string;
  eligible: boolean;
  skill_profile: { skills: Array<{ skill: string; score: number; attempts: number }> } | null;
}

class OrganizationDashboardService {
  async getCollegeDashboard() {
    return (await api.get<CollegeDashboardData>("/college/dashboard")).data;
  }

  async getCollegeStudents() {
    return (await api.get<CollegeStudent[]>("/college/students")).data;
  }

  async addCollegeStudent(data: {
    user_email_or_username: string;
    department_id?: number;
    batch_id?: number;
    roll_number?: string;
  }) {
    return (await api.post<CollegeStudent>("/college/student/add", data)).data;
  }

  async getDepartments() {
    return (await api.get<CollegeDepartment[]>("/college/department")).data;
  }

  async createDepartment(data: { name: string; code: string; head_name?: string }) {
    return (await api.post<CollegeDepartment>("/college/department", data)).data;
  }

  async getBatches() {
    return (await api.get<CollegeBatch[]>("/college/batch")).data;
  }

  async createBatch(data: { name: string; passout_year: number; department_id?: number }) {
    return (await api.post<CollegeBatch>("/college/batch", data)).data;
  }

  async getCollegeAssessments() {
    return (await api.get<CollegeAssessment[]>("/college/assessment/list")).data;
  }

  async createCollegeAssessment(data: {
    department_id?: number;
    batch_id?: number;
    title: string;
    description?: string;
    assessment_type: string;
    duration_minutes: number;
    pass_marks: number;
    total_marks: number;
    questions: Array<{
      question_type: string;
      skill_category: string;
      question_text: string;
      options: string[];
      correct_option: string;
      marks: number;
    }>;
  }) {
    return (await api.post<CollegeAssessment>("/college/assessment", data)).data;
  }

  async getAssessmentResults(assessmentId: number) {
    return (await api.get<CollegeAssessmentResult[]>(`/college/assessment/${assessmentId}/results`)).data;
  }

  async getCompanyDashboard() {
    return (await api.get<CompanyDashboardData>("/company/dashboard")).data;
  }

  async getCompanyJobs() {
    return (await api.get<CompanyJob[]>("/company/jobs")).data;
  }

  async createCompanyJob(data: {
    title: string;
    location?: string;
    employment_type?: string;
    remote_allowed?: boolean;
    description?: string;
    required_skills?: string;
    compensation?: string;
    status?: string;
  }) {
    return (await api.post<CompanyJob>("/company/jobs", data)).data;
  }

  async getCompanyCandidates(jobId?: number) {
    return (await api.get<CompanyCandidate[]>("/company/candidates", {
      params: jobId ? { job_id: jobId } : undefined,
    })).data;
  }

  async discoverCandidates(jobId: number) {
    return (await api.get<DiscoverableCandidate[]>("/company/discover", {
      params: { job_id: jobId },
    })).data;
  }

  async updateApplicationStatus(applicationId: number, status: "shortlisted" | "rejected") {
    return (await api.patch(`/company/applications/${applicationId}/status`, { status })).data;
  }

  async createJobAssessment(jobId: number, data: {
    title: string;
    difficulty: string;
    duration_minutes: number;
    question_count: number;
    sections: Array<{
      title: string;
      question_type: "mcq";
      skill_category: string;
      question_count: number;
      weight: number;
      duration_minutes: number;
    }>;
  }) {
    return (await api.post(`/company/jobs/${jobId}/assessment`, data)).data;
  }
}

export const organizationDashboardService = new OrganizationDashboardService();
