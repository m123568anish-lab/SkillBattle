import { create } from "zustand";
import { isAxiosError } from "axios";

import { getDashboardCacheKey, isDashboardCachePayload } from "@/lib/dashboard-data.mjs";
import { API_ORIGIN } from "@/lib/api-origin.mjs";
import {
    dashboardService,
    DashboardResponse,
} from "@/services/dashboard.service";
import {
    persistDashboardSyncActivity,
    readDashboardSyncActivity,
    upsertDashboardSyncActivity,
    type DashboardSyncActivity,
} from "@/lib/dashboard-sync-activity.mjs";

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

function saveDashboardToCache(data: DashboardResponse): boolean {
    if (typeof window === "undefined") return false;
    try {
        const payload: DashboardCachePayload = {
            data,
            timestamp: new Date().toISOString(),
            userId: data.user.id,
            apiOrigin: API_ORIGIN,
        };
        localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(payload));
        return true;
    } catch {
        return false;
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
    syncEvents: DashboardSyncActivity[];
    error: string | null;
    loadDashboard: (userId?: string) => Promise<void>;
    refresh: () => Promise<void>;
    recordSyncEvent: (event: DashboardSyncActivity) => void;
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
    syncEvents: readDashboardSyncActivity(),
    error: null,

    recordSyncEvent(event) {
        const syncEvents = upsertDashboardSyncActivity(get().syncEvents, event);
        persistDashboardSyncActivity(syncEvents);
        set({ syncEvents });
    },

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
        const syncEventId = `dashboard-sync:${userId}:${requestVersion}`;
        const syncStartedAt = new Date().toISOString();
        get().recordSyncEvent({
            id: syncEventId,
            user_id: userId,
            title: "Dashboard synchronization",
            description: "Dashboard metrics are being updated from the API.",
            status: "in_progress",
            created_at: syncStartedAt,
            updated_at: syncStartedAt,
        });

        set({
            loading: !hadDashboard,
            isRefreshing: hadDashboard,
            error: null,
        });

        activeDashboardPromise = (async () => {
            try {
                const data = await dashboardService.getDashboard();
                if (requestVersion !== dashboardRequestVersion) {
                    const supersededAt = new Date().toISOString();
                    get().recordSyncEvent({
                        id: syncEventId,
                        user_id: userId,
                        title: "Dashboard synchronization superseded",
                        description: "This refresh was superseded before it could update the dashboard.",
                        status: "failed",
                        created_at: syncStartedAt,
                        updated_at: supersededAt,
                    });
                    return;
                }
                if (data.user.id !== userId) {
                    const failedAt = new Date().toISOString();
                    get().recordSyncEvent({
                        id: syncEventId,
                        user_id: userId,
                        title: "Dashboard synchronization failed",
                        description: "The dashboard response did not match the signed-in account and was not applied.",
                        status: "failed",
                        created_at: syncStartedAt,
                        updated_at: failedAt,
                    });
                    set((state) => ({
                        loading: false,
                        isRefreshing: false,
                        error: "Dashboard response did not match the signed-in account. Please retry.",
                        isFromCache: Boolean(state.dashboard),
                        isStale: Boolean(state.dashboard),
                    }));
                    return;
                }
                const cacheUpdated = saveDashboardToCache(data);
                const completedAt = new Date().toISOString();
                get().recordSyncEvent({
                    id: syncEventId,
                    user_id: userId,
                    title: "Dashboard data refreshed",
                    description: cacheUpdated
                        ? "Latest dashboard metrics were synchronized and saved to this browser's cache."
                        : "Latest dashboard metrics were synchronized. Browser caching was unavailable.",
                    status: "completed",
                    created_at: syncStartedAt,
                    updated_at: completedAt,
                });

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
                if (requestVersion !== dashboardRequestVersion) {
                    const supersededAt = new Date().toISOString();
                    get().recordSyncEvent({
                        id: syncEventId,
                        user_id: userId,
                        title: "Dashboard synchronization superseded",
                        description: "This refresh was superseded before it could update the dashboard.",
                        status: "failed",
                        created_at: syncStartedAt,
                        updated_at: supersededAt,
                    });
                    return;
                }
                const failedAt = new Date().toISOString();
                get().recordSyncEvent({
                    id: syncEventId,
                    user_id: userId,
                    title: "Dashboard synchronization failed",
                    description: "The latest dashboard metrics could not be synchronized. Retry from the dashboard.",
                    status: "failed",
                    created_at: syncStartedAt,
                    updated_at: failedAt,
                });
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
