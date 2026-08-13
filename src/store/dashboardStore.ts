import { create } from "zustand";

import {
    dashboardService,
    DashboardResponse,
} from "@/services/dashboard.service";

interface DashboardState {
    dashboard: DashboardResponse | null;

    loading: boolean;

    error: string | null;

    loadDashboard: () => Promise<void>;

    refresh: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({

    dashboard: null,

    loading: false,

    error: null,

    async loadDashboard() {

        set({
            loading: true,
            error: null,
        });

        try {

            console.log("📤 Loading Dashboard...");

            const data = await dashboardService.getDashboard();

            console.log("📥 Dashboard Response:", data);

            set({
                dashboard: data,
                loading: false,
                error: null,
            });

        } catch (err: any) {

            console.error("❌ Dashboard Error:", err);

            set({
                loading: false,
                dashboard: null,
                error:
                    err?.response?.data?.detail ||
                    err?.message ||
                    "Unable to load dashboard.",
            });

        }

    },

    async refresh() {

        await get().loadDashboard();

    },

}));