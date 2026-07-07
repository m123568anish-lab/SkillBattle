"use client";

import { RotateCcw } from "lucide-react";

interface Props {
    onClick: () => void;
}

export default function RegenerateButton({
    onClick,
}: Props) {
    return (
        <button
            onClick={onClick}
            className="rounded-lg p-2 hover:bg-slate-200"
        >
            <RotateCcw size={16} />
        </button>
    );
}