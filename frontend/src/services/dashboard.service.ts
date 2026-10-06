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
        skill_name: string;
        priority: string;
        reason: string;
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
        streak: number;
        rating: number;
        battles_played: number;
        battles_won: number;
    };

    achievements: any[];

    weekly_activity?: any[];

    ai_recommendation: any;

    daily_challenge: any;

    command_center?: DashboardCommandCenter;
}

class DashboardService {
    async getDashboard(): Promise<DashboardResponse> {
        const response = await api.get<DashboardResponse>("/dashboard");
        return response.data;
    }
}

export const dashboardService = new DashboardService();