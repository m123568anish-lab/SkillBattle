export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  category: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  points: number;
  unlock_condition: string;
}

export interface UserAchievement extends Achievement {
  unlocked_at: string;
  progress?: number;
  max_progress?: number;
}

export interface AchievementProgress {
  achievement_id: string;
  current_progress: number;
  max_progress: number;
  percentage_complete: number;
  unlocked: boolean;
}
