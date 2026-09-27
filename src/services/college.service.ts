import api from "./api";

export interface College {
  id: number;
  name: string;
  code: string;
  domain: string;
  city: string;
  state: string;
  is_verified: boolean;
  admin_user_id?: string;
  created_at: string;
}

export interface Department {
  id: number;
  college_id: number;
  name: string;
  code: string;
  head_name: string;
  created_at: string;
}

export interface Batch {
  id: number;
  college_id: number;
  department_id?: number;
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
  department_name?: string;
  batch_name?: string;
  joined_at: string;
}

export interface Assessment {
  id: number;
  college_id: number;
  department_id?: number;
  batch_id?: number;
  created_by_user_id: string;
  title: string;
  description: string;
  assessment_type: string;
  duration_minutes: number;
  start_time?: string;
  end_time?: string;
  status: string;
  pass_marks: number;
  total_marks: number;
  created_at: string;
  questions_count: number;
}

export interface CollegeDashboard {
  college_name: string;
  total_students: number;
  active_students: number;
  assessment_participation_rate: number;
  average_performance_score: number;
  pass_rate: number;
  skill_distribution: Array<{ skill: string; average_score: number }>;
  weak_areas: string[];
  department_analytics: Array<{ department_name: string; total_students: number; avg_performance: number; pass_rate: number }>;
  placement_prep_progress: number;
}

export const collegeService = {
  // Registration & Info
  async registerCollege(data: any): Promise<College> {
    const res = await api.post<College>("/college/register", data);
    return res.data;
  },

  async getMyCollege(): Promise<College | null> {
    const res = await api.get<College | null>("/college/my-college");
    return res.data;
  },

  // Departments & Batches
  async createDepartment(name: string, code: string, head_name?: string): Promise<Department> {
    const res = await api.post<Department>("/college/department", { name, code, head_name });
    return res.data;
  },

  async getDepartments(): Promise<Department[]> {
    const res = await api.get<Department[]>("/college/department");
    return res.data;
  },

  async createBatch(name: string, passout_year: number, department_id?: number): Promise<Batch> {
    const res = await api.post<Batch>("/college/batch", { name, passout_year, department_id });
    return res.data;
  },

  async getBatches(): Promise<Batch[]> {
    const res = await api.get<Batch[]>("/college/batch");
    return res.data;
  },

  // Students
  async addStudent(user_email_or_username: string, department_id?: number, batch_id?: number, roll_number?: string): Promise<CollegeStudent> {
    const res = await api.post<CollegeStudent>("/college/student/add", {
      user_email_or_username,
      department_id,
      batch_id,
      roll_number,
    });
    return res.data;
  },

  async getStudents(department_id?: number, batch_id?: number): Promise<CollegeStudent[]> {
    const params: any = {};
    if (department_id) params.department_id = department_id;
    if (batch_id) params.batch_id = batch_id;
    const res = await api.get<CollegeStudent[]>("/college/students", { params });
    return res.data;
  },

  // Assessments
  async createAssessment(data: any): Promise<Assessment> {
    const res = await api.post<Assessment>("/college/assessment", data);
    return res.data;
  },

  async scheduleAssessment(id: number, start_time: string, end_time: string, department_id?: number, batch_id?: number): Promise<Assessment> {
    const res = await api.post<Assessment>(`/college/assessment/${id}/schedule`, {
      start_time,
      end_time,
      department_id,
      batch_id,
    });
    return res.data;
  },

  async getAssessments(): Promise<Assessment[]> {
    const res = await api.get<Assessment[]>("/college/assessment/list");
    return res.data;
  },

  async getAssessmentResults(assessmentId: number): Promise<any[]> {
    const res = await api.get<any[]>(`/college/assessment/${assessmentId}/results`);
    return res.data;
  },

  // Student portal
  async getMyAssignedAssessments(): Promise<Assessment[]> {
    const res = await api.get<Assessment[]>("/college/student/my-assessments");
    return res.data;
  },

  async submitAssessment(assessmentId: number, answers: any): Promise<any> {
    const res = await api.post("/college/student/assessment/submit", {
      assessment_id: assessmentId,
      answers,
    });
    return res.data;
  },

  // Dashboard Analytics
  async getCollegeDashboard(): Promise<CollegeDashboard> {
    const res = await api.get<CollegeDashboard>("/college/dashboard");
    return res.data;
  },
};
