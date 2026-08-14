import { useEffect } from "react";

import { careerService } from "@/services/career";

import { useCareerStore } from "@/stores/career-store";
import { ResumeAnalysis } from "@/types/analysis";

export function useAnalysis(

    resumeId?: string,

) {

    const {

        analysis,

        setAnalysis,

    } = useCareerStore();

    useEffect(() => {

        if (!resumeId) return;

        load();

        const timer = setInterval(load, 2000);

        return () => clearInterval(timer);

    }, [resumeId]);

    async function load() {

        if (!resumeId) return;

        const data = await careerService.getAnalysis(

            resumeId,

        );

        setAnalysis(data as ResumeAnalysis);

    }

    return {

        analysis,

    };

}