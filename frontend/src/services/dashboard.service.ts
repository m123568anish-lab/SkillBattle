import { api } from "@/lib/api";
import { isDashboardStats } from "@/lib/dashboard-data.mjs";
import type { DashboardResponse } from "@/types/dashboard";

export type { DashboardCommandCenter, DashboardResponse } from "@/types/dashboard";

class DashboardService {
    async getDashboard(): Promise<DashboardResponse> {
        const response = await api.get<DashboardResponse>("/dashboard");
        if (!isDashboardStats(response.data?.stats)) {
            throw new Error("Dashboard API returned incomplete or invalid statistics.");
        }
        return response.data;
    }
}

export const dashboardService = new DashboardService();
