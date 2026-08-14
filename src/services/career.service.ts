import api from "./api";

export interface RoadmapTask {
  id: number;
  day: number;
  topic: string;
  difficulty: string;
  estimated_minutes: number;
  reward_xp: number;
  completed: boolean;
  completed_at?: string;
}

export interface RoadmapWeek {
  id: number;
  week_number: number;
  title: string;
  objective: string;
  completion: number;
  tasks: RoadmapTask[];
}

export interface Roadmap {
  id: number;
  user_id: string;
  title: string;
  target_company: string;
  duration_weeks: number;
  estimated_hours: number;
  progress: number;
  status: string;
  created_at: string;
  weeks: RoadmapWeek[];
}

export interface ResumeData {
  id?: string;
  title: string;
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  skills: string[];
  education: any[];
  experience: any[];
  projects: any[];
  certifications: string[];
  ats_score?: number;
  placement_score?: number;
  ai_summary?: string;
}

export const careerService = {
  // Roadmap
  async generateRoadmap(title: string, targetCompany: string, durationWeeks: number): Promise<Roadmap> {
    const res = await api.post<Roadmap>("/career/roadmap/generate", {
      title,
      target_company: targetCompany,
      duration_weeks: durationWeeks,
    });
    return res.data;
  },

  async getUserRoadmaps(): Promise<Roadmap[]> {
    const res = await api.get<Roadmap[]>("/career/roadmap/user");
    return res.data;
  },

  async getRoadmap(roadmapId: number): Promise<Roadmap> {
    const res = await api.get<Roadmap>(`/career/roadmap/${roadmapId}`);
    return res.data;
  },

  async completeTask(taskId: number): Promise<{ status: string; reward_xp: number }> {
    const res = await api.put<{ status: string; reward_xp: number }>(`/career/roadmap/task/${taskId}/complete`);
    return res.data;
  },

  // Resume
  async getUserResume(): Promise<ResumeData | null> {
    const res = await api.get<ResumeData | null>("/career/resume");
    return res.data;
  },

  async saveResume(data: ResumeData): Promise<ResumeData> {
    const res = await api.post<ResumeData>("/career/resume", data);
    return res.data;
  },

  async generateResumeFromProfile(): Promise<ResumeData> {
    const res = await api.post<ResumeData>("/career/resume/generate");
    return res.data;
  },

  async analyzeResume(data: ResumeData): Promise<any> {
    const res = await api.post("/career/resume/analyze", data);
    return res.data;
  },

  // Interview
  async startInterview(company: string, role: string, difficulty: string): Promise<any> {
    const res = await api.post("/career/interview/start", { company, role, difficulty });
    return res.data;
  },

  async submitInterviewAnswer(questionId: number, answer: string): Promise<any> {
    const res = await api.post("/career/interview/answer", { question_id: questionId, answer });
    return res.data;
  },

  async getUserInterviews(): Promise<any[]> {
    const res = await api.get("/career/interview/user");
    return res.data;
  },
};
