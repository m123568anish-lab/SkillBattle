import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const normalizeBaseUrl = (value: string | undefined) => {
    const base = (value || "http://localhost:8000").trim().replace(/\/+$/, "");
    return base.replace(/\/api\/v1$/, "");
};

const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
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
        const originalRequest = error.config as InternalAxiosRequestConfig | undefined;
        const url = originalRequest?.url ?? "";

        if (
            originalRequest &&
            error.response?.status === 401 &&
            !(originalRequest as any)._retry &&
            !url.includes("/auth/login") &&
            !url.includes("/auth/register") &&
            !url.includes("/auth/refresh")
        ) {
            (originalRequest as any)._retry = true;

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