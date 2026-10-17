"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { useAuthStore } from "@/store/authStore";

export function useDashboard(resumeId?: string) {
    const userId = useAuthStore((state) => state.user?.id ?? null);
    const dashboard = useDashboardStore((state) => state.dashboard);
    const loading = useDashboardStore((state) => state.loading);
    const isRefreshing = useDashboardStore((state) => state.isRefreshing);
    const isFromCache = useDashboardStore((state) => state.isFromCache);
    const lastRefreshedAt = useDashboardStore((state) => state.lastRefreshedAt);
    const error = useDashboardStore((state) => state.error);
    const refresh = useDashboardStore((state) => state.refresh);
    const loadDashboard = useDashboardStore((state) => state.loadDashboard);

    useEffect(() => {
        if (!userId) return;
        // Always revalidate for the authenticated user. The previous guard
        // skipped the first request when the store started in loading state.
        void loadDashboard(userId);
    }, [loadDashboard, userId]);

    return {
        dashboard,
        loading,
        isRefreshing,
        isFromCache,
        lastRefreshedAt,
        error,
        refresh,
        loadDashboard,
    };
}
