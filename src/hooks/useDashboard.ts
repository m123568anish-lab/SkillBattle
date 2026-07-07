"use client";

import { useQuery } from "@tanstack/react-query";

import { careerService } from "@/services/career";

export function useDashboard(resumeId: string) {

    return useQuery({

        queryKey: ["dashboard", resumeId],

        queryFn: async () => {

            const resume = await careerService.getResume(
                resumeId,
            );

            const analysis =
                await careerService.getAnalysis(
                    resumeId,
                );

            return {
                resume,
                analysis,
            };
        },

        refetchInterval: 5000,

    });

}