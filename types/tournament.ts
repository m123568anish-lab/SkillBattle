export interface Tournament {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  entry_fee?: number;
  prize_pool?: number;
  status: "pending" | "active" | "completed" | "cancelled";
  difficulty: "easy" | "medium" | "hard" | "mixed";
  format: "single_elimination" | "round_robin" | "swiss";
  created_by: string;
  participants_count: number;
  created_at: string;
  updated_at: string;
}

export interface TournamentParticipant {
  user_id: string;
  username: string;
  avatar_url?: string;
  registered_at: string;
  wins: number;
  losses: number;
  rating: number;
  position?: number;
}

export interface TournamentCreate {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  entry_fee?: number;
  prize_pool?: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  format: "single_elimination" | "round_robin" | "swiss";
}

export interface TournamentUpdate {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  max_participants?: number;
  status?: "pending" | "active" | "completed" | "cancelled";
}
