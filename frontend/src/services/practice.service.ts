import api from "@/lib/api";

export type PracticeStatus = "solved" | "attempted" | "unsolved";

export interface PracticeProblem {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  category: string;
  xp_reward: number;
  status: PracticeStatus;
  tags: string[];
}

export interface PracticeProblemDetail extends PracticeProblem {
  description: string;
  input_format: string;
  output_format: string;
  constraints: string;
  explanation: string;
  time_limit: number;
  memory_limit: number;
  starter_codes: Record<string, string>;
  samples: Array<{ input: string; output: string; explanation: string }>;
}

export interface DailyPayload {
  available: boolean;
  reason?: string;
  challenge?: { id: number; title: string; difficulty: string; category: string };
  problem?: PracticeProblem;
  session?: { id: number; status: string; completed_at?: string; submission_id?: number };
  streak?: number;
  is_revision?: boolean;
}

export interface CompilerRunResult {
  status: string;
  stdout?: string;
  stderr?: string;
  execution_time?: number;
  memory_used?: number;
  test_cases?: Array<{
    input: string;
    expected_output?: string;
    actual_output?: string;
    passed?: boolean;
    status?: string;
    execution_time?: number;
  }>;
}

export interface CompilerSubmitResult {
  status: string;
  stdout?: string;
  stderr?: string;
  execution_time?: number;
  memory_used?: number;
  xp_awarded?: number;
  test_cases?: Array<{
    input: string;
    expected_output?: string;
    actual_output?: string;
    passed?: boolean;
    status?: string;
    execution_time?: number;
  }>;
}

export const practiceService = {
  list: async (params: Record<string, string | number | undefined>, signal?: AbortSignal) =>
    (
      await api.get<{
        items: PracticeProblem[];
        total: number;
        page: number;
        page_size: number;
        categories: string[];
      }>("/practice/problems", { params, signal })
    ).data,

  get: async (id: number) =>
    (await api.get<PracticeProblemDetail>(`/practice/problems/${id}`)).data,

  summary: async () =>
    (await api.get<{ solved: number; attempted: number; accuracy: number | null }>("/practice/summary")).data,

  daily: async () => (await api.get<DailyPayload>("/practice/daily")).data,

  startDaily: async () => (await api.post<DailyPayload>("/practice/daily/start")).data,

  run: async (payload: {
    language: string;
    code: string;
    custom_input?: string;
    problem_id?: number;
  }): Promise<CompilerRunResult> => {
    const res = await api.post("/compiler/run", {
      language: payload.language,
      source_code: payload.code,
      stdin: payload.custom_input || "",
      custom_input: true,
    });
    const d = res.data;
    return {
      status: d.stderr ? "runtime_error" : "accepted",
      stdout: d.stdout || "",
      stderr: d.stderr || "",
      execution_time: d.execution_time,
      memory_used: d.memory_used,
      test_cases: [],
    };
  },

  submit: async (payload: {
    problem_id: number;
    language: string;
    code: string;
  }): Promise<CompilerSubmitResult> => {
    const res = await api.post("/compiler/submit", {
      problem_id: payload.problem_id,
      language: payload.language,
      source_code: payload.code,
    });
    const d = res.data;
    const isPassed = d.verdict === "Accepted";
    return {
      status: isPassed ? "passed" : "failed",
      stdout: d.stdout || "",
      stderr: d.stderr || "",
      execution_time: d.execution_time,
      memory_used: d.memory_used,
      xp_awarded: d.xp_earned,
      test_cases: [],
    };
  },
};
