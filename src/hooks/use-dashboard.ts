"use client";

import { useEffect } from "react";

import { useDashboardStore } from "@/store/dashboardStore";
import { useAuthStore } from "@/store/authStore";

export function useDashboard(resumeId?: string) {
    void resumeId;
    const dashboard = useDashboardStore((state) => state.dashboard);
    const loading = useDashboardStore((state) => state.loading);
    const error = useDashboardStore((state) => state.error);
    const loadDashboard = useDashboardStore((state) => state.loadDashboard);
    const refresh = useDashboardStore((state) => state.refresh);
    const reset = useDashboardStore((state) => state.reset);
    const authLoading = useAuthStore((state) => state.loading);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            reset();
            return;
        }
        if (!dashboard && !loading && !error) loadDashboard();
    }, [authLoading, dashboard, error, loading, loadDashboard, reset, user]);

    return {
        dashboard,
        loading: authLoading || loading,
        error,
        refresh,
        loadDashboard,
    };

}