import axios from "axios";
import { create } from "zustand";
import { LoginRequest, User } from "@/types/auth";
import { authService } from "@/services/auth.service";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unavailable" | "forbidden";

interface AuthState {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    status: AuthStatus;
    authError: string | null;
    login(data: LoginRequest): Promise<User>;
    logout(): Promise<void>;
    loadUser(sessionKey?: string): Promise<void>;
    clearSession(message?: string): void;
    markUnavailable(message: string): void;
    updateUserPartial(fields: Partial<User>): void;
}

function getInitialUser(): User | null {
    if (typeof window === "undefined") return null;
    try {
        const stored = localStorage.getItem("skillbattle_user_cache");
        return stored ? JSON.parse(stored) : null;
    } catch { return null; }
}

const initialCachedUser = getInitialUser();
let activeLoadUser: { sessionKey: string; promise: Promise<void> } | null = null;
let activeAuthSessionKey: string | null = null;
let authRequestGeneration = 0;

function classify(error: unknown): AuthStatus {
    if (axios.isAxiosError(error) && error.response?.status === 401) return "unauthenticated";
    if (axios.isAxiosError(error) && error.response?.status === 403) return "forbidden";
    return "unavailable";
}

function errorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) return "Authentication service is busy. Please try again.";
        if ((error.response?.status ?? 0) >= 500 || !error.response) return "Authentication service is temporarily unavailable.";
    }
    return error instanceof Error ? error.message : "Unable to resolve your account.";
}

function cacheUser(user: User | null) {
    if (typeof window === "undefined") return;
    try {
        if (user) localStorage.setItem("skillbattle_user_cache", JSON.stringify(user));
        else localStorage.removeItem("skillbattle_user_cache");
    } catch { /* localStorage is optional */ }
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: initialCachedUser,
    // A cached profile is not proof of a live session; Clerk/Backend must resolve it.
    loading: true,
    isAuthenticated: false,
    status: "loading",
    authError: null,

    async login(data) {
        authRequestGeneration += 1;
        activeAuthSessionKey = "legacy";
        activeLoadUser = null;
        set({ loading: true, status: "loading", authError: null });
        try {
            const user = await authService.login(data);
            cacheUser(user);
            set({ user, loading: false, isAuthenticated: true, status: "authenticated", authError: null });
            return user;
        } catch (error) {
            set({ loading: false, isAuthenticated: false, status: "unauthenticated", authError: errorMessage(error) });
            throw error;
        }
    },

    async logout() {
        authRequestGeneration += 1;
        activeAuthSessionKey = null;
        activeLoadUser = null;
        await authService.logout();
        cacheUser(null);
        if (typeof window !== "undefined") localStorage.removeItem("skillbattle_dashboard_cache");
        set({ user: null, loading: false, isAuthenticated: false, status: "unauthenticated", authError: null });
    },

    async loadUser(sessionKey) {
        const requestedSessionKey = sessionKey ?? activeAuthSessionKey ?? "legacy";
        if (activeLoadUser?.sessionKey === requestedSessionKey) return activeLoadUser.promise;

        if (activeAuthSessionKey && activeAuthSessionKey !== requestedSessionKey) {
            authRequestGeneration += 1;
            activeLoadUser = null;
            cacheUser(null);
            if (typeof window !== "undefined") localStorage.removeItem("skillbattle_dashboard_cache");
            set({
                user: null,
                isAuthenticated: false,
                loading: true,
                status: "loading",
                authError: null,
            });
        }
        activeAuthSessionKey = requestedSessionKey;
        const requestGeneration = authRequestGeneration;
        set({ loading: true, status: "loading", authError: null });
        const loadRequest = { sessionKey: requestedSessionKey, promise: Promise.resolve() };
        const promise = (async () => {
            try {
                const user = await authService.getCurrentUser();
                if (requestGeneration !== authRequestGeneration) return;
                cacheUser(user);
                set({ user, loading: false, isAuthenticated: true, status: "authenticated", authError: null });
            } catch (error) {
                if (requestGeneration !== authRequestGeneration) return;
                const status = classify(error);
                if (status === "unauthenticated" || status === "forbidden") {
                    cacheUser(null);
                    set({ user: null, loading: false, isAuthenticated: false, status, authError: errorMessage(error) });
                } else {
                    // Cold starts, timeouts, rate limits, and 5xx responses do not log out.
                    set({ loading: false, isAuthenticated: Boolean(get().user), status, authError: errorMessage(error) });
                }
            } finally {
                if (activeLoadUser === loadRequest) activeLoadUser = null;
            }
        })();
        loadRequest.promise = promise;
        activeLoadUser = loadRequest;
        return promise;
    },

    clearSession(message) {
        authRequestGeneration += 1;
        activeAuthSessionKey = null;
        activeLoadUser = null;
        cacheUser(null);
        if (typeof window !== "undefined") localStorage.removeItem("skillbattle_dashboard_cache");
        set({
            user: null,
            loading: false,
            isAuthenticated: false,
            status: "unauthenticated",
            authError: message ?? null,
        });
    },

    markUnavailable(message) {
        // A provider/bootstrap failure is not proof that the session is invalid.
        // Protected content remains hidden because isAuthenticated stays false.
        set({
            loading: false,
            isAuthenticated: false,
            status: "unavailable",
            authError: message,
        });
    },

    updateUserPartial(fields) {
        set((state) => {
            if (!state.user) return { user: null };
            const user = { ...state.user, ...fields, avatar_url: fields.avatar_url ?? fields.avatar ?? state.user.avatar_url ?? null };
            cacheUser(user);
            return { user };
        });
    },
}));
