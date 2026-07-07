"use client";

import DashboardHome from "./DashboardHome";
import ErrorCard from "./ErrorCard";
import LoadingCard from "./LoadingCard";

import { useDashboard } from "@/hooks/useDashboard";

interface DashboardContentProps {
    resumeId: string;
}

export default function DashboardContent({
    resumeId,
}: DashboardContentProps) {
    const {
        data,
        isLoading,
        isError,
    } = useDashboard(resumeId);

    if (isLoading) {
        return <LoadingCard />;
    }

    if (isError || !data) {
        return (
            <ErrorCard message="Unable to load dashboard." />
        );
    }

    return (
        <DashboardHome
            resume={data.resume}
            analysis={data.analysis}
        />
    );
}