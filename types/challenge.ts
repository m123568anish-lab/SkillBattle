export interface Challenge {
  id: string;
  title: string;
  description: string;
  problem_statement: string;
  difficulty: "easy" | "medium" | "hard";
  language: string;
  time_limit: number;
  memory_limit: number;
  test_cases_count: number;
  passing_rate: number;
  likes: number;
  created_by: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ChallengeCreate {
  title: string;
  description: string;
  problem_statement: string;
  difficulty: "easy" | "medium" | "hard";
  language: string;
  time_limit: number;
  memory_limit: number;
  test_cases: TestCase[];
  tags?: string[];
}

export interface ChallengeUpdate {
  title?: string;
  description?: string;
  problem_statement?: string;
  difficulty?: "easy" | "medium" | "hard";
  time_limit?: number;
  memory_limit?: number;
}

export interface TestCase {
  input: string;
  expected_output: string;
  is_hidden: boolean;
}

export interface ChallengeSolution {
  challenge_id: string;
  code: string;
  language: string;
  execution_time: number;
  memory_used: number;
  test_cases_passed: number;
  test_cases_total: number;
}
