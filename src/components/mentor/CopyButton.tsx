"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface Props {
    text: string;
}

export default function CopyButton({
    text,
}: Props) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        await navigator.clipboard.writeText(text);

        setCopied(true);

        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <button
            onClick={copy}
            className="rounded-lg p-2 hover:bg-slate-200"
        >
            {copied ? (
                <Check size={16} />
            ) : (
                <Copy size={16} />
            )}
        </button>
    );
}