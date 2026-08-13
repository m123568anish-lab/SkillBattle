import { api } from "@/lib/api";

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

    ai_recommendation: any;

    daily_challenge: any;
}

class DashboardService {
    async getDashboard(): Promise<DashboardResponse> {
        const response = await api.get<DashboardResponse>("/dashboard");
        return response.data;
    }
}

export const dashboardService = new DashboardService();