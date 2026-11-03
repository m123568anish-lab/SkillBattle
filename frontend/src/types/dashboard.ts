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
  next_level_xp: number;
  xp_to_next_level: number;
  level_progress_percent: number;
  streak: number;
  longest_streak: number;
  rating: number;
  battles_played: number;
  battles_completed: number;
  battles_won: number;
  battles_lost: number;
  practice_attempted: number;
  practice_completed: number;
  practice_tasks_completed: number;
  practice_accuracy: number | null;
  daily_challenge_completed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface WeeklyActivity {
  day: string;
  xp: number;
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
  is_completed: boolean;
}

export interface SkillProgress {
  subject: string;
  correct_attempts: number;
  total_attempts: number;
  accuracy_percent: number;
}

export interface RecentActivity {
  activity_type: string;
  activity_date: string;
  xp_earned: number;
}

export interface DashboardResponse {
  user: UserSummary;
  stats: DashboardStats;
  weekly_activity: WeeklyActivity[];
  achievements: Achievement[];
  ai_recommendation: AIRecommendation;
  daily_challenge: DailyChallenge;
  skill_progress: SkillProgress[];
  recent_activity: RecentActivity[];
}
