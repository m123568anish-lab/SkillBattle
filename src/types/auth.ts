export interface User {

    id: string;
    username?: string;
    full_name: string;
    email: string;
    avatar?: string | null;
    avatar_url?: string | null;
    role: string;
    account_type?: "STUDENT" | "COLLEGE" | "COMPANY";
    requested_role?: string | null;
    level?: number;
    coding_rating?: number;
    onboarding_completed?: boolean;
    is_superuser?: boolean;

}

export interface LoginRequest {

    email: string;

    password: string;

    role?: string;

}

export interface RegisterRequest {

    full_name: string;

    email: string;

    password: string;

}

export interface LoginResponse {

    user: User;

    tokens: {

        access_token: string;

        refresh_token: string;

        expires_in: number;

    };

}

export interface RefreshResponse {

    access_token: string;

    expires_in: number;

}