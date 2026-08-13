"use client";

import MarkdownMessage from "./MarkdownMessage";
import CopyButton from "./CopyButton";
import RegenerateButton from "./RegenerateButton";

import { ChatMessage } from "@/types/mentor";

interface MessageBubbleProps {
    message: ChatMessage;
    onRegenerate?: () => void;
}

export default function MessageBubble({
    message,
    onRegenerate,
}: MessageBubbleProps) {
    const isUser = message.role === "user";

    return (
        <div
            className={`flex ${
                isUser ? "justify-end" : "justify-start"
            }`}
        >
            <div
                className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-sm ${
                    isUser
                        ? "bg-blue-600 text-white"
                        : "border bg-white text-gray-900"
                }`}
            >
                {isUser ? (
                    <p className="whitespace-pre-wrap break-words">
                        {message.content}
                    </p>
                ) : (
                    <>
                        <MarkdownMessage
                            content={message.content}
                        />

                        <div className="mt-4 flex items-center justify-end gap-2 border-t pt-3">

                            <CopyButton
                                text={message.content}
                            />

                            {onRegenerate && (
                                <RegenerateButton
                                    onClick={onRegenerate}
                                />
                            )}

                        </div>
                    </>
                )}
            </div>
        </div>
    );
}