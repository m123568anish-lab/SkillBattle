import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_ORIGIN } from "@/lib/api-origin.mjs";

// Shared API types — import from here for typed responses
export type { ApiResponse, ApiValidationError, PaginatedResponse } from "@/types/api";

// Browser requests use Next.js rewrites; server-side requests use the configured API origin.
const API_BASE_URL =
    typeof window === "undefined"
        ? API_ORIGIN
        : "";

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    timeout: 20_000,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

type ClerkTokenGetter = () => Promise<string | null>;

let clerkTokenGetter: ClerkTokenGetter | null = null;
let clerkSessionActive = false;
let clerkTokenPromise: Promise<string | null> | null = null;

/**
 * Clerk owns the browser session, while legacy users may still have the
 * application's access/refresh token pair. Keep both paths available during
 * the migration and prefer the Clerk token whenever a Clerk session exists.
 */
export function configureClerkTokenProvider(
    getToken: ClerkTokenGetter | null,
    active = false,
) {
    clerkTokenGetter = getToken;
    clerkSessionActive = active;
    clerkTokenPromise = null;
}

let refreshPromise: Promise<string> | null = null;
const SAFE_RETRY_METHODS = new Set(["get", "head", "options"]);

function getClerkToken(): Promise<string | null> {
    if (clerkTokenPromise) return clerkTokenPromise;
    const getter = clerkTokenGetter;
    if (!getter) return Promise.resolve(null);

    clerkTokenPromise = (async () => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        try {
            return await Promise.race([
                Promise.resolve().then(getter),
                new Promise<null>((_, reject) => {
                    timeoutId = setTimeout(() => reject(new Error("Timed out while resolving the Clerk session.")), 3500);
                }),
            ]);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            clerkTokenPromise = null;
        }
    })();
    return clerkTokenPromise;
}

async function refreshLegacyAccessToken(): Promise<string> {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (!refreshToken) throw new Error("No refresh token is available.");

    const response = await api.post("/auth/refresh", { refresh_token: refreshToken });
    const token = response.data?.access_token;
    if (typeof token !== "string" || !token) {
        throw new Error("The refresh response did not include an access token.");
    }
    localStorage.setItem("access_token", token);
    return token;
}

function getLegacyRefreshPromise(): Promise<string> {
    if (refreshPromise) return refreshPromise;
    const promise = refreshLegacyAccessToken();
    refreshPromise = promise;
    void promise.finally(() => {
        if (refreshPromise === promise) refreshPromise = null;
    }).catch(() => undefined);
    return promise;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
        const clerkToken = await getClerkToken();
        const token = clerkSessionActive
            ? clerkToken
            : clerkToken || localStorage.getItem("access_token");

        if (clerkSessionActive && !token) {
            throw new Error("The active Clerk session did not provide an access token.");
        }
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError & { config?: InternalAxiosRequestConfig }) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const url = originalRequest?.url ?? "";
        const isAuthRequest = /\/auth\/(login|register|refresh|me|logout|account)/i.test(url);
        const method = (originalRequest?.method || "get").toLowerCase();

        if (
            originalRequest &&
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !clerkSessionActive &&
            !url.includes("/auth/login") &&
            !url.includes("/auth/register") &&
            !url.includes("/auth/refresh") &&
            SAFE_RETRY_METHODS.has(method)
        ) {
            originalRequest._retry = true;

            try {
                const token = await getLegacyRefreshPromise();
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return await api(originalRequest);
            } catch (e) {
                const refreshStatus = axios.isAxiosError(e) ? e.response?.status : undefined;
                if (typeof window !== "undefined" && (refreshStatus === 401 || refreshStatus === 403)) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    window.dispatchEvent(new Event("skillbattle:session-invalid"));
                }
                return Promise.reject(e);
            }
        }

        if (
            originalRequest &&
            !originalRequest._retry &&
            !isAuthRequest &&
            SAFE_RETRY_METHODS.has(method) &&
            [502, 503, 504].includes(error.response?.status ?? 0)
        ) {
            originalRequest._retry = true;
            await new Promise((resolve) => setTimeout(resolve, 250));
            return api(originalRequest);
        }

        return Promise.reject(error);
    }
);

api.interceptors.response.use((response) => {
    const method = response.config.method?.toLowerCase();
    const url = response.config.url ?? "";
    if (
        typeof window !== "undefined" &&
        method &&
        !SAFE_RETRY_METHODS.has(method) &&
        !/\/auth\/(?:login|register|refresh|logout|me|account)(?:\/|$)/i.test(url)
    ) {
        window.dispatchEvent(new Event("skillbattle:dashboard-invalidated"));
    }
    return response;
});

export default api;
export { api };
