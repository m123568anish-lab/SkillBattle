"use client";

interface Props {
    onSelect: (prompt: string) => void;
}

const prompts = [
    "Improve my ATS score",
    "Review my resume",
    "Generate interview questions",
    "Suggest projects",
    "Find missing skills",
    "Prepare me for HR interview",
];

export default function SuggestedPrompts({
    onSelect,
}: Props) {
    return (
        <div className="flex flex-wrap gap-3">

            {prompts.map((prompt) => (

                <button
                    key={prompt}
                    onClick={() => onSelect(prompt)}
                    className="rounded-full border px-4 py-2 hover:bg-blue-600 hover:text-white transition"
                >
                    {prompt}
                </button>

            ))}

        </div>
    );
}