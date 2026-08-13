"use client";

interface Props {
    role: string;
    confidence: number;
}

export default function JobRecommendationCard({
    role,
    confidence,
}: Props) {
    return (
        <div className="rounded-xl bg-white p-5 shadow">

            <h3 className="text-lg font-semibold">
                {role}
            </h3>

            <p className="mt-2 text-blue-600">
                Match Score: {confidence}%
            </p>

        </div>
    );
}