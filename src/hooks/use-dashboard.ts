"use client";

import { useEffect } from "react";

import { useDashboardStore } from "@/store/dashboardStore";

export function useDashboard(resumeId?: string) {

    const store = useDashboardStore();

    useEffect(() => {

        if (!store.dashboard && !store.loading) {

            store.loadDashboard();

        }

    }, []);

    return {

        dashboard: store.dashboard,

        loading: store.loading,

        error: store.error,

        refresh: store.refresh,

        loadDashboard: store.loadDashboard,

    };

}