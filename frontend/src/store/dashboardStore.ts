import { create } from "zustand";
import { isAxiosError } from "axios";

import { getDashboardCacheKey, isDashboardCachePayload } from "@/lib/dashboard-data.mjs";
import { API_ORIGIN } from "@/lib/api-origin.mjs";
import {
    dashboardService,
    DashboardResponse,
} from "@/services/dashboard.service";

interface DashboardCachePayload {
    data: DashboardResponse;
    timestamp: string;
    userId: string;
    apiOrigin: string;
}

const DASHBOARD_CACHE_KEY = getDashboardCacheKey(API_ORIGIN);

function getCachedDashboard(userId?: string): DashboardCachePayload | null {
    if (typeof window === "undefined") return null;
    try {
        const stored = localStorage.getItem(DASHBOARD_CACHE_KEY);
        if (!stored) return null;
        const parsed: unknown = JSON.parse(stored);
        if (!userId) {
            const userStored = localStorage.getItem("skillbattle_user_cache");
            if (!userStored) return null;
            const parsedUser: unknown = JSON.parse(userStored);
            if (
                typeof parsedUser !== "object" ||
                parsedUser === null ||
                !("id" in parsedUser) ||
                typeof parsedUser.id !== "string"
            ) {
                return null;
            }
            userId = parsedUser.id;
        }
        if (isDashboardCachePayload(parsed, userId, API_ORIGIN)) {
            return parsed;
        }
    } catch {
        return null;
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
            apiOrigin: API_ORIGIN,
        };
        localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(payload));
    } catch {
        // Storage limit or private mode
    }
}

interface DashboardState {
    dashboard: DashboardResponse | null;
    userId: string | null;
    loading: boolean;
    isRefreshing: boolean;
    isFromCache: boolean;
    isStale: boolean;
    lastRefreshedAt: string | null;
    error: string | null;
    loadDashboard: (userId?: string) => Promise<void>;
    refresh: () => Promise<void>;
    reset: () => void;
}

const initialCache = getCachedDashboard();

let activeDashboardPromise: Promise<void> | null = null;
let activeDashboardUserId: string | null = null;
let dashboardRequestVersion = 0;
let dashboardInvalidationVersion = 0;

export const useDashboardStore = create<DashboardState>((set, get) => ({
    dashboard: initialCache ? initialCache.data : null,
    userId: initialCache?.userId ?? null,
    loading: !initialCache,
    isRefreshing: false,
    isFromCache: Boolean(initialCache),
    isStale: Boolean(initialCache),
    lastRefreshedAt: initialCache ? initialCache.timestamp : null,
    error: null,

    async loadDashboard(requestedUserId) {
        let userId = requestedUserId ?? get().userId;
        if (!userId && typeof window !== "undefined") {
            try {
                const storedUser = localStorage.getItem("skillbattle_user_cache");
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    if (parsed?.id) userId = parsed.id;
                }
            } catch {
                // ignore
            }
        }
        if (!userId) return;

        if (activeDashboardPromise && activeDashboardUserId === userId) {
            return activeDashboardPromise;
        }

        if (get().userId !== userId) {
            dashboardRequestVersion += 1;
            const cached = getCachedDashboard(userId);
            set({
                dashboard: cached?.data ?? null,
                userId,
                loading: !cached,
                isRefreshing: false,
                isFromCache: Boolean(cached),
                isStale: Boolean(cached),
                lastRefreshedAt: cached?.timestamp ?? null,
                error: null,
            });
        }

        const currentDashboard = get().dashboard;
        const hadDashboard = Boolean(currentDashboard);
        const requestVersion = ++dashboardRequestVersion;
        activeDashboardUserId = userId;

        set({
            loading: !hadDashboard,
            isRefreshing: hadDashboard,
            error: null,
        });

        activeDashboardPromise = (async () => {
            try {
                const data = await dashboardService.getDashboard();
                if (requestVersion !== dashboardRequestVersion || data.user.id !== userId) return;
                saveDashboardToCache(data);

                set({
                    dashboard: data,
                    userId,
                    loading: false,
                    isRefreshing: false,
                    isFromCache: false,
                    isStale: false,
                    lastRefreshedAt: new Date().toISOString(),
                    error: null,
                });
            } catch (err: unknown) {
                if (requestVersion !== dashboardRequestVersion) return;
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
                    isStale: Boolean(state.dashboard),
                }));
            } finally {
                if (activeDashboardUserId === userId) {
                    activeDashboardPromise = null;
                    activeDashboardUserId = null;
                }
            }
        })();

        return activeDashboardPromise;
    },

    async refresh() {
        await get().loadDashboard();
    },

    reset() {
        dashboardRequestVersion += 1;
        activeDashboardPromise = null;
        activeDashboardUserId = null;
        if (typeof window !== "undefined") {
            try {
                localStorage.removeItem(DASHBOARD_CACHE_KEY);
            } catch {
                // ignore
            }
        }
        set({
            dashboard: null,
            userId: null,
            loading: false,
            isRefreshing: false,
            isFromCache: false,
            isStale: false,
            lastRefreshedAt: null,
            error: null,
        });
    },
}));

if (typeof window !== "undefined") {
    window.addEventListener("skillbattle:dashboard-invalidated", () => {
        const state = useDashboardStore.getState();
        if (!state.dashboard || !state.userId) return;
        const invalidatedUserId = state.userId;
        const invalidationVersion = ++dashboardInvalidationVersion;
        useDashboardStore.setState({ isFromCache: true, isStale: true });

        const refreshAfterCurrentRequest = () => {
            const current = useDashboardStore.getState();
            if (
                invalidationVersion === dashboardInvalidationVersion &&
                current.userId === invalidatedUserId &&
                current.dashboard
            ) {
                void current.refresh();
            }
        };

        if (activeDashboardPromise) {
            void activeDashboardPromise.then(refreshAfterCurrentRequest);
        } else {
            refreshAfterCurrentRequest();
        }
    });
}
