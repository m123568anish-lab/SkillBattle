"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
    onSend: (message: string) => Promise<void>;
}

export default function MessageInput({
    onSend,
}: MessageInputProps) {

    const [message, setMessage] = useState("");

    async function handleSend() {

        if (!message.trim()) return;

        await onSend(message);

        setMessage("");
    }

    return (

        <div className="border-t bg-white p-5">

            <div className="flex gap-3">

                <input

                    value={message}

                    onChange={(e) =>
                        setMessage(e.target.value)
                    }

                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSend();
                        }
                    }}

                    placeholder="Ask AI Mentor..."

                    className="flex-1 rounded-xl border p-4 outline-none focus:ring-2 focus:ring-blue-500"

                />

                <button

                    onClick={handleSend}

                    className="rounded-xl bg-blue-600 px-6 text-white hover:bg-blue-700"

                >

                    <Send size={20} />

                </button>

            </div>

        </div>

    );
}