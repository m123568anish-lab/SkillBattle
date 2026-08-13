export interface Roadmap {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_role: string;
  target_date: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  progress_percentage: number;
  tasks: RoadmapTask[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  status: "not_started" | "in_progress" | "completed";
  order: number;
  due_date?: string;
  completed_at?: string;
  resource_links?: string[];
}

export interface RoadmapCreate {
  title: string;
  description?: string;
  target_role: string;
  target_date: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
}

export interface RoadmapUpdate {
  title?: string;
  description?: string;
  target_date?: string;
  difficulty_level?: "beginner" | "intermediate" | "advanced";
}

export interface RoadmapProgress {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  progress_percentage: number;
  estimated_completion_date: string;
  milestones: Milestone[];
}

export interface Milestone {
  title: string;
  completion_percentage: number;
  target_date: string;
  completed: boolean;
}
