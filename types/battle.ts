export interface Battle {
  id: string;
  title: string;
  description?: string;
  problem_id: string;
  language: string;
  difficulty: "easy" | "medium" | "hard";
  duration: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  created_by: string;
  participants: BattleParticipant[];
  winner_id?: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
}

export interface BattleParticipant {
  user_id: string;
  username: string;
  avatar_url?: string;
  submitted_at?: string;
  execution_time?: number;
  memory_used?: number;
  test_cases_passed?: number;
  test_cases_total?: number;
  rating_change?: number;
}

export interface BattleCreate {
  title: string;
  description?: string;
  problem_id: string;
  language: string;
  difficulty: "easy" | "medium" | "hard";
  duration: number;
}

export interface BattleUpdate {
  title?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
}

export interface BattleResult {
  battle_id: string;
  winner_id: string;
  participants_results: BattleParticipantResult[];
  completion_time: number;
  test_cases_passed: number;
  test_cases_total: number;
}

export interface BattleParticipantResult {
  user_id: string;
  position: number;
  execution_time: number;
  memory_used: number;
  test_cases_passed: number;
  rating_change: number;
}
