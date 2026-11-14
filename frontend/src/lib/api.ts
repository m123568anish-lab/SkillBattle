import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_ORIGIN } from "@/lib/api-origin.mjs";

// Shared API types — import from here for typed responses
export type { ApiResponse, ApiValidationError, PaginatedResponse } from "@/types/api";

// Browser requests use Next.js rewrites; server-side requests use the configured API origin.
const API_BASE_URL =
    typeof window === "undefined"
        ? API_ORIGIN
        : "";

const API_TIMEOUT_MS = 20_000;

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    timeout: API_TIMEOUT_MS,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

type NeonTokenGetter = () => Promise<string | null>;

let neonTokenGetter: NeonTokenGetter | null = null;
let neonTokenPromise: Promise<string | null> | null = null;

export function configureNeonTokenProvider(getToken: NeonTokenGetter | null) {
    neonTokenGetter = getToken;
    neonTokenPromise = null;
}

const SAFE_RETRY_METHODS = new Set(["get", "head", "options"]);

function getNeonToken(): Promise<string | null> {
    if (neonTokenPromise) return neonTokenPromise;
    const getter = neonTokenGetter;
    if (!getter) return Promise.resolve(null);

    neonTokenPromise = (async () => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        try {
            return await Promise.race([
                Promise.resolve().then(getter),
                new Promise<never>((_, reject) => {
                    timeoutId = setTimeout(() => reject(new Error("Timed out while resolving the Neon Auth session.")), API_TIMEOUT_MS);
                }),
            ]);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            neonTokenPromise = null;
        }
    })();
    return neonTokenPromise;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
        const token = await getNeonToken();
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
        const isAuthRequest = /\/auth\/(login|register|refresh|me|logout|account|neon\/link)/i.test(url);
        const method = (originalRequest?.method || "get").toLowerCase();

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
        !/\/auth\/(?:login|register|refresh|logout|me|account|neon\/link)(?:\/|$)/i.test(url)
    ) {
        window.dispatchEvent(new Event("skillbattle:dashboard-invalidated"));
    }
    return response;
});

export default api;
export { api };
