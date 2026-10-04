import { useEffect } from "react";

import { careerService } from "@/services/career";

import { useCareerStore } from "@/stores/career-store";
import { ResumeAnalysis } from "@/types/analysis";

export function useAnalysis(resumeId?: string) {
    const { analysis, setAnalysis } = useCareerStore();

    const load = async () => {
        if (!resumeId) return;

        const data = await careerService.getAnalysis(resumeId);
        setAnalysis(data as ResumeAnalysis);
    };

    useEffect(() => {
        if (!resumeId) return;

        void load();

        const timer = setInterval(() => {
            void load();
        }, 2000);

        return () => clearInterval(timer);
    }, [resumeId, setAnalysis]);

    return { analysis };
}