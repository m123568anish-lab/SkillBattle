import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Shared API types — import from here for typed responses
export type { ApiResponse, ApiValidationError, PaginatedResponse } from "@/types/api";

const normalizeBaseUrl = (value: string | undefined): string => {
    const defaultUrl =
        process.env.NODE_ENV === "production"
            ? "https://skillbattle-api-2026.onrender.com"
            : "http://localhost:8000";
    const base = (value || defaultUrl).trim().replace(/\/+$/, "");
    return base.replace(/\/api\/v1$/, "");
};

const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    timeout: 15_000,                  // 15 s — prevent hanging on sleeping Render instance
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

const processQueue = (token: string | null) => {
    pendingRequests.forEach((cb) => cb(token || ""));
    pendingRequests = [];
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError & { config?: InternalAxiosRequestConfig }) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean; _fallbackRetry?: boolean }) | undefined;
        const url = originalRequest?.url ?? "";

        // Fallback retry for network errors / connection refused when target is localhost
        if (
            originalRequest &&
            !error.response &&
            !originalRequest._fallbackRetry &&
            (api.defaults.baseURL?.includes("localhost") || originalRequest.baseURL?.includes("localhost") || originalRequest.url?.includes("localhost"))
        ) {
            originalRequest._fallbackRetry = true;
            originalRequest.baseURL = "https://skillbattle-api-2026.onrender.com/api/v1";
            originalRequest.timeout = 30_000; // Allow 30s for Render cold start
            try {
                return await axios(originalRequest);
            } catch (fallbackErr) {
                return Promise.reject(fallbackErr);
            }
        }

        if (
            originalRequest &&
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !url.includes("/auth/login") &&
            !url.includes("/auth/register") &&
            !url.includes("/auth/refresh")
        ) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve) => {
                    pendingRequests.push((token: string) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        resolve(api(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
                if (!refreshToken) {
                    throw new Error("no refresh token");
                }

                const resp = await api.post("/auth/refresh", { refresh_token: refreshToken });
                const token = resp.data?.access_token;

                if (token) {
                    localStorage.setItem("access_token", token);
                    processQueue(token);
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return api(originalRequest);
                }

                throw new Error("refresh token response missing access token");
            } catch (e) {
                if (typeof window !== "undefined") {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    const PUBLIC_ROUTES = [
                        "/",
                        "/login",
                        "/register",
                        "/forgot-password",
                        "/verify-email",
                        "/reset-password",
                    ];

                    const pathname = window.location.pathname || "/";

                    if (!PUBLIC_ROUTES.includes(pathname)) {
                        window.location.assign("/login");
                    }
                }
                return Promise.reject(e);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
export { api };