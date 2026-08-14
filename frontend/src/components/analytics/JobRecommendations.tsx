"use client";

import JobRecommendationCard from "./JobRecommendationCard";

interface Props {
    jobs: {
        role: string;
        confidence: number;
    }[];
}

export default function JobRecommendations({
    jobs,
}: Props) {
    return (
        <div className="space-y-4">

            <h2 className="text-xl font-bold">
                Recommended Jobs
            </h2>

            {jobs.map((job) => (
                <JobRecommendationCard
                    key={job.role}
                    role={job.role}
                    confidence={job.confidence}
                />
            ))}

        </div>
    );
}