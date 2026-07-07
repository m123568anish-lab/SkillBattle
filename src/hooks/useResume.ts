import { useEffect } from "react";

import { careerService } from "@/services/career";

import { useCareerStore } from "@/stores/career-store";

export function useResume() {

    const {

        resumes,

        setResumes,

    } = useCareerStore();

    useEffect(() => {

        load();

    }, []);

    async function load() {

        const data = await careerService.getResumes();

        setResumes(data);

    }

    return {

        resumes,

        reload: load,

    };

}