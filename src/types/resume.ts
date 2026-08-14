export interface ResumeMetadata {
    filename: string;
    content_type: string;
    file_size: number;
    uploaded_at: string;
}

export interface UploadResponse {
    success: boolean;
    message: string;
    resume_id: string;
    status: string;
}

export interface Resume {
    id: string;
    filename: string;
    uploaded_at: string;
    ats_score?: number;
    placement_score?: number;
    parsed: boolean;
    ai_processed: boolean;
}