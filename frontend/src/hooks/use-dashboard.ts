"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";

export function useDashboard(resumeId?: string) {
    const store = useDashboardStore();

    useEffect(() => {
        // Trigger live revalidation on mount if not currently loading or refreshing
        if (!store.loading && !store.isRefreshing) {
            void store.loadDashboard();
        }
    }, []);

    return {
        dashboard: store.dashboard,
        loading: store.loading,
        isRefreshing: store.isRefreshing,
        isFromCache: store.isFromCache,
        lastRefreshedAt: store.lastRefreshedAt,
        error: store.error,
        refresh: store.refresh,
        loadDashboard: store.loadDashboard,
    };
}