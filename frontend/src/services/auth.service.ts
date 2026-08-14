import { api } from "@/lib/api";

import {

    LoginRequest,

    RegisterRequest,

    LoginResponse,

    User,

    RefreshResponse,

} from "@/types/auth";

class AuthService {

    // =========================

    async login(data: LoginRequest) {

        console.log("📤 Login Request:", data);

        try {
            const response = await api.post(
                "/auth/login",
                data,
            );

            console.log("📥 Backend Response:", response.data);

            const result = response.data;

            localStorage.setItem(
                "access_token",
                result.tokens.access_token
            );

            localStorage.setItem(
                "refresh_token",
                result.tokens.refresh_token
            );

            console.log("✅ Tokens Saved");

            return result.user;
        } catch (err: any) {
            if (err.response) {
                console.error("Login failed - response status:", err.response.status);
                console.error("Login failed - response data:", err.response.data);
            } else {
                console.error("Login failed - no response:", err.message || err);
            }
            throw err;
        }
    }

    // =========================

    async register(data: any) {

    const response = await api.post(

        "/auth/register",

        data,

    );

    return response.data;

}

    // =========================

    async getCurrentUser() {

        const response = await api.get<User>(

            "/auth/me",

        );

        return response.data;

    }

    // =========================

    async refreshToken() {

        const refresh = localStorage.getItem(

            "refresh_token",

        );

        if (!refresh) {

            throw new Error(

                "Refresh token missing",

            );

        }

        const response = await api.post<RefreshResponse>(

            "/auth/refresh",

            {

                refresh_token: refresh,

            },

        );

        localStorage.setItem(

            "access_token",

            response.data.access_token,

        );

        return response.data;

    }

    // =========================

    async logout() {

        const refresh = localStorage.getItem(

            "refresh_token",

        );

        if (refresh) {

            try {

                await api.post(

                    "/auth/logout",

                    {

                        refresh_token: refresh,

                    },

                );

            }

            catch {}

        }

        localStorage.removeItem(

            "access_token",

        );

        localStorage.removeItem(

            "refresh_token",

        );

    }

}

export const authService = new AuthService();