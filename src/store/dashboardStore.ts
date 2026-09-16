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

    reset: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({

    dashboard: null,

    loading: false,

    error: null,

    reset() {
        set({ dashboard: null, loading: false, error: null });
    },

    async loadDashboard() {
        if (get().loading) return;
        set({
            loading: true,
            error: null,
        });

        try {
            const data = await dashboardService.getDashboard();

            set({
                dashboard: data,
                loading: false,
                error: null,
            });

        } catch (err: unknown) {
            const error = err as {
                response?: { data?: { detail?: string } };
                message?: string;
            };
            set({
                dashboard: null,
                error:
                    error.response?.data?.detail ||
                    error.message ||
                    "Unable to load dashboard.",
            });
        } finally {
            set({ loading: false });
        }

    },

    async refresh() {
        set({ error: null });
        await get().loadDashboard();
    },

}));