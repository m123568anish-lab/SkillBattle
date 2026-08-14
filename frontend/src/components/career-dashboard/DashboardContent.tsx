"use client";

import DashboardHome from "./DashboardHome";
import ErrorCard from "./ErrorCard";
import LoadingCard from "./LoadingCard";

import { useDashboard } from "@/hooks/use-dashboard";

interface DashboardContentProps {
    resumeId: string;
}

export default function DashboardContent({
    resumeId,
}: DashboardContentProps) {
    const {
        dashboard,
        loading,
        error,
        refresh,
    } = useDashboard(resumeId);

    if (loading) {
        return <LoadingCard />;
    }

    if (error || !dashboard) {
        return (
            <ErrorCard message="Unable to load dashboard." />
        );
    }

    return (
        <DashboardHome
            resume={dashboard}
            analysis={dashboard}
        />
    );
}