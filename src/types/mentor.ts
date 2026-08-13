export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

export interface MentorRequest {
    resume_id: string;
    question: string;
}

export interface MentorResponse {
    answer: string;
}

export interface SuggestedQuestion {
    id: number;
    text: string;
}