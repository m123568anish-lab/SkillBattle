export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    full_name: string;
    email: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface User {
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
    is_active: boolean;
    created_at: string;
}