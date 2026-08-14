"use client";

import { useEffect, useRef } from "react";

import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

import { ChatMessage } from "@/types/mentor";

interface ChatWindowProps {
    messages: ChatMessage[];
    loading: boolean;
    onRegenerate?: () => void;
}

export default function ChatWindow({
    messages,
    loading,
    onRegenerate,
}: ChatWindowProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, loading]);

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50">

            {messages.length === 0 ? (
                <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 text-center">

                    <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-4xl text-white shadow-lg">
                        🤖
                    </div>

                    <h1 className="text-4xl font-bold text-slate-900">
                        AI Career Mentor
                    </h1>

                    <p className="mt-4 max-w-xl text-lg text-slate-500">
                        I'm here to help you improve your resume,
                        prepare for interviews, learn new skills,
                        and plan your career.
                    </p>

                    <div className="mt-10 grid w-full max-w-2xl gap-4 md:grid-cols-2">

                        <div className="rounded-xl border bg-white p-5 shadow-sm">
                            <h3 className="font-semibold">
                                📄 Resume Review
                            </h3>

                            <p className="mt-2 text-sm text-gray-500">
                                Analyze my resume and suggest improvements.
                            </p>
                        </div>

                        <div className="rounded-xl border bg-white p-5 shadow-sm">
                            <h3 className="font-semibold">
                                🎯 ATS Optimization
                            </h3>

                            <p className="mt-2 text-sm text-gray-500">
                                Improve my ATS score.
                            </p>
                        </div>

                        <div className="rounded-xl border bg-white p-5 shadow-sm">
                            <h3 className="font-semibold">
                                💼 Job Recommendations
                            </h3>

                            <p className="mt-2 text-sm text-gray-500">
                                Which companies should I apply to?
                            </p>
                        </div>

                        <div className="rounded-xl border bg-white p-5 shadow-sm">
                            <h3 className="font-semibold">
                                🎤 Interview Preparation
                            </h3>

                            <p className="mt-2 text-sm text-gray-500">
                                Generate interview questions.
                            </p>
                        </div>

                    </div>

                </div>
            ) : (
                <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">

                    {messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            onRegenerate={onRegenerate}
                        />
                    ))}

                    {loading && <TypingIndicator />}

                    <div ref={bottomRef} />

                </div>
            )}

        </div>
    );
}