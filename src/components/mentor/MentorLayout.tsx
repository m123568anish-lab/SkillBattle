"use client";

import { useState } from "react";
import { BrainCircuit } from "lucide-react";

import ChatWindow from "./ChatWindow";
import MessageInput from "./MessageInput";
import SuggestedPrompts from "./SuggestedPrompts";

import { useMentor } from "@/hooks/useMentor";

interface MentorLayoutProps {
    resumeId: string;
}

export default function MentorLayout({
    resumeId,
}: MentorLayoutProps) {

    const {
        messages,
        loading,
        send,
    } = useMentor(resumeId);

    const [lastPrompt, setLastPrompt] = useState("");

    async function handleSend(message: string) {

        if (!message.trim()) return;

        setLastPrompt(message);

        await send(message);

    }

    async function regenerate() {

        if (!lastPrompt) return;

        await send(lastPrompt);

    }

    return (

        <div className="flex h-screen flex-col bg-slate-100">

            {/* Header */}

            <header className="border-b bg-white shadow-sm">

                <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">

                    <div className="flex items-center gap-4">

                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white">

                            <BrainCircuit size={28} />

                        </div>

                        <div>

                            <h1 className="text-3xl font-bold">

                                AI Career Mentor

                            </h1>

                            <p className="text-gray-500">

                                Personalized Resume & Career Assistant

                            </p>

                        </div>

                    </div>

                    <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">

                        ● Online

                    </div>

                </div>

            </header>

            {/* Suggested Prompts */}

            <div className="border-b bg-white px-8 py-5">

                <div className="mx-auto max-w-7xl">

                    <SuggestedPrompts
                        onSelect={handleSend}
                    />

                </div>

            </div>

            {/* Chat */}

            <div className="flex-1 overflow-hidden">

                <ChatWindow
                    messages={messages}
                    loading={loading}
                    onRegenerate={regenerate}
                />

            </div>

            {/* Input */}

            <div className="border-t bg-white">

                <div className="mx-auto max-w-7xl">

                    <MessageInput
                        onSend={handleSend}
                    />

                </div>

            </div>

        </div>

    );

}