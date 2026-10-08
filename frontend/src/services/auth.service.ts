import { api } from "@/lib/api";

import {

    LoginRequest,

    RegisterRequest,

    LoginResponse,

    User,

    RefreshResponse,

} from "@/types/auth";
import type {
    CollegeRegistrationRequest,
    CompanyRegistrationRequest,
} from "@/types/organization";

class AuthService {

    // =========================

    async login(data: LoginRequest) {
        const response = await api.post<LoginResponse>("/auth/login", data);
        const result = response.data;
        localStorage.setItem("access_token", result.tokens.access_token);
        localStorage.setItem("refresh_token", result.tokens.refresh_token);
        return result.user;
    }


    // =========================

    async register(data: RegisterRequest) {

    const response = await api.post<User>(

        "/auth/register",

        data,

    );

    return response.data;

}

    async registerCollege(data: CollegeRegistrationRequest) {
        const response = await api.post("/college/register", data);
        return response.data;
    }

    async registerCompany(data: CompanyRegistrationRequest) {
        const response = await api.post("/company/register", data);
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

    async deleteAccount(confirmation: string, password?: string) {
        const response = await api.delete<{ message: string }>("/auth/account", {
            data: { confirmation, password },
        });
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return response.data;
    }

}

export const authService = new AuthService();