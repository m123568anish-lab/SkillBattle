import { create } from "zustand";
import { isAxiosError } from "axios";

import {
    dashboardService,
    DashboardResponse,
} from "@/services/dashboard.service";

interface DashboardCachePayload {
    data: DashboardResponse;
    timestamp: string;
    userId: string;
}

const DASHBOARD_CACHE_KEY = "skillbattle_dashboard_cache";

function getCachedDashboard(): DashboardCachePayload | null {
    if (typeof window === "undefined") return null;
    try {
        const stored = localStorage.getItem(DASHBOARD_CACHE_KEY);
        if (!stored) return null;
        const parsed = JSON.parse(stored) as DashboardCachePayload;
        const userStored = localStorage.getItem("skillbattle_user_cache");
        if (userStored) {
            const parsedUser = JSON.parse(userStored);
            if (parsedUser?.id && parsed?.userId && parsedUser.id !== parsed.userId) {
                return null;
            }
        }
        if (parsed?.data?.user?.id && parsed?.timestamp) {
            return parsed;
        }
    } catch {
        // Ignore parse error
    }
    return null;
}

function saveDashboardToCache(data: DashboardResponse) {
    if (typeof window === "undefined") return;
    try {
        const payload: DashboardCachePayload = {
            data,
            timestamp: new Date().toISOString(),
            userId: data.user.id,
        };
        localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(payload));
    } catch {
        // Storage limit or private mode
    }
}

interface DashboardState {
    dashboard: DashboardResponse | null;
    loading: boolean;
    isRefreshing: boolean;
    isFromCache: boolean;
    lastRefreshedAt: string | null;
    error: string | null;
    loadDashboard: () => Promise<void>;
    refresh: () => Promise<void>;
}

const initialCache = getCachedDashboard();

let activeDashboardPromise: Promise<void> | null = null;

export const useDashboardStore = create<DashboardState>((set, get) => ({
    dashboard: initialCache ? initialCache.data : null,
    loading: !initialCache,
    isRefreshing: false,
    isFromCache: Boolean(initialCache),
    lastRefreshedAt: initialCache ? initialCache.timestamp : null,
    error: null,

    async loadDashboard() {
        if (activeDashboardPromise) {
            return activeDashboardPromise;
        }

        const currentDashboard = get().dashboard;
        const hadDashboard = Boolean(currentDashboard);

        set({
            loading: !hadDashboard,
            isRefreshing: hadDashboard,
            error: null,
        });

        activeDashboardPromise = (async () => {
            try {
                const data = await dashboardService.getDashboard();
                saveDashboardToCache(data);

                set({
                    dashboard: data,
                    loading: false,
                    isRefreshing: false,
                    isFromCache: false,
                    lastRefreshedAt: new Date().toISOString(),
                    error: null,
                });
            } catch (err: unknown) {
                const responseData = isAxiosError(err) ? err.response?.data : null;
                const serverMessage = responseData?.detail ?? responseData?.message;
                const message = typeof serverMessage === "string"
                    ? serverMessage
                    : err instanceof Error
                        ? err.message
                        : "Unable to load dashboard. Please try again.";

                // Preserve previous dashboard data if available so the UI stays functional
                set((state) => ({
                    loading: false,
                    isRefreshing: false,
                    error: message,
                    isFromCache: Boolean(state.dashboard),
                }));
            } finally {
                activeDashboardPromise = null;
            }
        })();

        return activeDashboardPromise;
    },

    async refresh() {
        await get().loadDashboard();
    },
}));