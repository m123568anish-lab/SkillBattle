"use client";

interface Props {
    roadmap: {
        title: string;
        duration: string;
    }[];
}

export default function RoadmapTimeline({
    roadmap,
}: Props) {
    return (
        <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="mb-6 text-xl font-bold">

                Learning Roadmap

            </h2>

            <div className="space-y-4">

                {roadmap.map((step, index) => (

                    <div
                        key={index}
                        className="border-l-4 border-blue-600 pl-4"
                    >

                        <h3 className="font-semibold">
                            {step.title}
                        </h3>

                        <p className="text-gray-500">
                            {step.duration}
                        </p>

                    </div>

                ))}

            </div>

        </div>
    );
}