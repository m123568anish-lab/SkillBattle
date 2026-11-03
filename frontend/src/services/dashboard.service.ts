import { api } from "@/lib/api";

export interface DashboardCommandCenter {
    student_state: {
        xp: number;
        streak: number;
        target_company: string;
        study_hours: { configured: boolean; minutes: number };
    };
    next_best_action: {
        title: string;
        type: string;
        why: string;
        skill_name?: string;
    };
    daily_actions: Array<{
        type: string;
        title: string;
        description: string;
        time: string;
        priority?: string;
    }>;
    placement_readiness: {
        state?: string;
        confidence?: string;
        matrix?: Record<string, any>;
    };
    skill_gaps: Array<{
        skill_id?: string;
        skill_name: string;
        priority: string;
        reason: string;
        mastery?: string;
        confidence?: string;
        trend?: string;
    }>;
    roadmap: {
        title: string;
        progress: number;
        milestone: string;
    };
    study_hours: { configured: boolean; minutes: number };
    summary: { strong_skills: number; weak_skills: number; gap_count: number };
}

export interface DashboardResponse {
    user: {
        id: string;
        username: string;
        full_name: string;
        email: string;
        avatar_url?: string | null;
        role?: string;
        is_superuser?: boolean;
    };

    stats: {
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
    };

    achievements: Array<{
        id: string;
        title: string;
        description: string;
        icon: string;
    }>;

    weekly_activity: Array<{ day: string; xp: number }>;

    ai_recommendation: {
        title: string;
        message: string;
        progress: number;
        action: string;
    };

    daily_challenge: {
        id: string;
        title: string;
        difficulty: string;
        description: string;
        xp_reward: number;
        is_completed: boolean;
    };
    skill_progress: Array<{
        subject: string;
        correct_attempts: number;
        total_attempts: number;
        accuracy_percent: number;
    }>;
    recent_activity: Array<{
        activity_type: string;
        activity_date: string;
        xp_earned: number;
    }>;

    command_center?: DashboardCommandCenter;
}

class DashboardService {
    async getDashboard(): Promise<DashboardResponse> {
        const response = await api.get<DashboardResponse>("/dashboard");
        return response.data;
    }
}

export const dashboardService = new DashboardService();
