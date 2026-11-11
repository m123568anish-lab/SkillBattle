import { api } from "@/lib/api";
import axios from "axios";

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

function clearStoredAuthTokens() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}

function extractErrorDetail(error: unknown): string | null {
    if (!axios.isAxiosError(error)) return null;

    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        const message = detail
            .map((item) => {
                if (typeof item === "string") return item;
                if (item && typeof item === "object" && "msg" in item && typeof item.msg === "string") {
                    return item.msg;
                }
                return "";
            })
            .filter(Boolean)
            .join(", ");
        return message || null;
    }
    if (detail && typeof detail === "object" && "msg" in detail && typeof detail.msg === "string") {
        return detail.msg;
    }
    return null;
}

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

    async linkNeonIdentity(password: string): Promise<boolean> {
        try {
            await api.post("/auth/neon/link", { password });
            return true;
        } catch (error) {
            const detail = extractErrorDetail(error);
            if (
                axios.isAxiosError(error) &&
                error.response?.status === 401 &&
                detail &&
                detail.includes("Unable to link this Neon account with the supplied Qubira credentials.")
            ) {
                return false;
            }
            throw error;
        }
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

        localStorage.setItem(

            "refresh_token",

            response.data.refresh_token,

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

        clearStoredAuthTokens();

    }

    async deleteAccount(confirmation: string, password?: string) {
        const response = await api.delete<{ message: string }>("/auth/account", {
            data: { confirmation, password },
        });
        clearStoredAuthTokens();
        return response.data;
    }

}

export const authService = new AuthService();
