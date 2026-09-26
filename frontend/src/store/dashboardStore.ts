import { create } from "zustand";
import { isAxiosError } from "axios";

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
            const data = await dashboardService.getDashboard();

            set({
                dashboard: data,
                loading: false,
                error: null,
            });
        } catch (err: unknown) {
            const responseData = isAxiosError(err) ? err.response?.data : null;
            const serverMessage = responseData?.detail ?? responseData?.message;
            set({
                loading: false,
                dashboard: null,
                error: typeof serverMessage === "string"
                    ? serverMessage
                    : err instanceof Error
                        ? err.message
                        : "Unable to load dashboard. Please try again.",
            });
        }


    },

    async refresh() {

        await get().loadDashboard();

    },

}));