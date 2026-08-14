"use client";

import { useState } from "react";

import { mentorService } from "@/services/mentor";

import { ChatMessage } from "@/types/mentor";

export function useMentor(resumeId: string) {

    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const [loading, setLoading] = useState(false);

    async function send(question: string) {

        const userMessage: ChatMessage = {

            id: crypto.randomUUID(),

            role: "user",

            content: question,

            created_at: new Date().toISOString(),

        };

        setMessages((prev) => [...prev, userMessage]);

        setLoading(true);

        try {

            const response = await mentorService.ask({

                resume_id: resumeId,

                question,

            });

            const aiMessage: ChatMessage = {

                id: crypto.randomUUID(),

                role: "assistant",

                content: response.answer,

                created_at: new Date().toISOString(),

            };

            setMessages((prev) => [...prev, aiMessage]);

        } finally {

            setLoading(false);

        }

    }

    return {

        messages,

        loading,

        send,

    };

}