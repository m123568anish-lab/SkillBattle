export interface UserSummary {
  id: string;
  username: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  role?: string;
  is_superuser?: boolean;
}

export interface DashboardStats {
  xp: number;
  level: number;
  streak: number;
  rating: number;
  battles_played: number;
  battles_won: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}
export interface AIRecommendation {
  title: string;
  message: string;
  progress: number;
  action: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  xp_reward: number;
}

export interface DashboardResponse {
  user: UserSummary;
  stats: DashboardStats;
  achievements: Achievement[];
  ai_recommendation: AIRecommendation;
  daily_challenge: DailyChallenge;
}