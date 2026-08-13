"use client";

export default function TypingIndicator() {

    return (

        <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3 w-fit">

            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600"></div>

            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:0.2s]"></div>

            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:0.4s]"></div>

            <span className="ml-2 text-sm text-gray-600">

                AI is typing...

            </span>

        </div>

    );

}