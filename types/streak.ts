export interface Streak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  total_activities: number;
  level: number;
  total_points: number;
}

export interface StreakActivity {
  date: string;
  activity_type: string;
  points_earned: number;
}

export interface StreakMilestone {
  milestone_number: number;
  streak_days: number;
  reward: string;
  unlocked_at?: string;
}
