import api from "@/lib/api";

export type PracticeStatus = "solved" | "attempted" | "unsolved";
export interface PracticeProblem { id: number; title: string; slug: string; difficulty: string; category: string; xp_reward: number; status: PracticeStatus; tags: string[]; }
export interface PracticeProblemDetail extends PracticeProblem { description: string; input_format: string; output_format: string; constraints: string; explanation: string; time_limit: number; memory_limit: number; starter_codes: Record<string, string>; samples: Array<{ input: string; output: string; explanation: string }>; }
export interface DailyPayload { available: boolean; reason?: string; challenge?: { id: number; title: string; difficulty: string; category: string }; problem?: PracticeProblem; session?: { id: number; status: string; completed_at?: string; submission_id?: number }; streak?: number; is_revision?: boolean; }
export const practiceService = {
  list: async (params: Record<string, string | number | undefined>, signal?: AbortSignal) => (await api.get<{items: PracticeProblem[]; total: number; page: number; page_size: number; categories: string[]}>("/practice/problems", { params, signal })).data,
  get: async (id: number) => (await api.get<PracticeProblemDetail>(`/practice/problems/${id}`)).data,
  summary: async () => (await api.get<{solved:number; attempted:number; accuracy:number|null}>("/practice/summary")).data,
  daily: async () => (await api.get<DailyPayload>("/practice/daily")).data,
  startDaily: async () => (await api.post<DailyPayload>("/practice/daily/start")).data,
};
