import { api } from "@/lib/api";

export interface Problem {
  id: number;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  category: string;
  description: string;
  input_format: string;
  output_format: string;
  constraints: string;
  explanation?: string;
  xp_reward: number;
  time_limit: number;
  memory_limit: number;
  is_active: boolean;
  created_at?: string;
  status?: "solved" | "attempted" | "unsolved";
  tags?: string[];
  starter_codes?: Record<string, string>;
  samples?: Array<{ input: string; output: string; explanation?: string | null }>;
}

export interface PracticeCatalogue {
  items: Problem[];
  total: number;
  page: number;
  page_size: number;
  categories: string[];
}

export interface PracticeSummary {
  solved: number;
  attempted: number;
  accuracy: number | null;
}

export interface DailyChallengeState {
  available: boolean;
  reason?: string;
  streak: number;
  is_revision?: boolean;
  challenge?: { id: number; title: string; difficulty: string; category: string; xp_reward: number };
  problem?: Problem | null;
  session?: { id: number; status: "IN_PROGRESS" | "COMPLETED"; completed_at?: string | null };
}

export interface Submission {
  id: number;
  user_id: string;
  problem_id: number;
  language: string;
  source_code: string;
  verdict: string;
  execution_time: number;
  memory_used: number;
  passed_tests: number;
  total_tests: number;
  created_at: string;
}

export interface SubmitCodeResponse {
  submission_id: number;
  verdict: string;
  passed_tests: number;
  total_tests: number;
  execution_time: number;
  memory_used: number;
  xp_earned: number;
}

class ProblemService {
  async getProblems(skip = 0, limit = 50): Promise<Problem[]> {
    const res = await api.get<Problem[]>("/problems", { params: { skip, limit } });
    return res.data;
  }

  async getPracticeCatalogue(params: { q?: string; difficulty?: string; category?: string; status?: string; page?: number; page_size?: number } = {}): Promise<PracticeCatalogue> {
    const res = await api.get<PracticeCatalogue>("/practice/problems", { params });
    return res.data;
  }

  async getPracticeSummary(): Promise<PracticeSummary> {
    const res = await api.get<PracticeSummary>("/practice/summary");
    return res.data;
  }

  async getDailyChallenge(): Promise<DailyChallengeState> {
    const res = await api.get<DailyChallengeState>("/practice/daily");
    return res.data;
  }

  async startDailyChallenge(): Promise<DailyChallengeState> {
    const res = await api.post<DailyChallengeState>("/practice/daily/start");
    return res.data;
  }

  async getProblem(id: number): Promise<Problem> {
    const res = await api.get<Problem>(`/practice/problems/${id}`);
    return res.data;
  }

  async getProblemsByDifficulty(difficulty: string): Promise<Problem[]> {
    const res = await api.get<Problem[]>(`/problems/difficulty/${difficulty}`);
    return res.data;
  }

  async getProblemsByCategory(category: string): Promise<Problem[]> {
    const res = await api.get<Problem[]>(`/problems/category/${category}`);
    return res.data;
  }

  async generateProblem(topic: string, difficulty: string): Promise<Problem> {
    const res = await api.post("/problem-generator/generate", { topic, difficulty });
    return res.data;
  }

  async runCode(language: string, source_code: string, stdin = "") {
    const res = await api.post("/compiler/run", { language, source_code, stdin });
    return res.data;
  }

  async submitCode(problem_id: number, language: string, source_code: string): Promise<SubmitCodeResponse> {
    const res = await api.post<SubmitCodeResponse>("/compiler/submit", { problem_id, language, source_code });
    return res.data;
  }

  async getMySubmissions(): Promise<Submission[]> {
    const res = await api.get<Submission[]>("/compiler/submissions/me");
    return res.data;
  }
}

export const problemService = new ProblemService();
