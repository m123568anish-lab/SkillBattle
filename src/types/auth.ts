export interface User {

    id: string;

    full_name: string;

    email: string;

    avatar?: string | null;

    role: string;

}

export interface LoginRequest {

    email: string;

    password: string;

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