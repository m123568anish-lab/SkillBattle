import axios from "axios";
import { create } from "zustand";
import { LoginRequest, User } from "@/types/auth";
import { authService } from "@/services/auth.service";
import { authClient } from "@/lib/auth/client";
import { useDashboardStore } from "@/store/dashboardStore";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unavailable" | "forbidden";

export class LegacyAccountPasswordRequiredError extends Error {
    constructor() {
        super("Enter the password you used for your previous Qubira account to connect it.");
        this.name = "LegacyAccountPasswordRequiredError";
    }
}

interface AuthState {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    status: AuthStatus;
    authError: string | null;
    login(data: LoginRequest, legacyPassword?: string): Promise<User>;
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
        const detail = error.response?.data?.detail;
        if (typeof detail === "string" && detail.trim()) return detail;
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
    // A cached profile is not proof of a live Neon Auth session.
    loading: true,
    isAuthenticated: false,
    status: "loading",
    authError: null,

    async login(data, legacyPassword) {
        authRequestGeneration += 1;
        activeAuthSessionKey = null;
        activeLoadUser = null;
        set({ loading: true, status: "loading", authError: null });
        try {
            const result = await authClient.signIn.email({
                email: data.email,
                password: data.password,
            });
            if (result.error) {
                throw new Error(result.error.message);
            }

            const sessionResult = await authClient.getSession();
            if (sessionResult.error) {
                throw new Error(sessionResult.error.message);
            }
            const sessionUser = sessionResult.data?.user;
            if (!sessionUser) {
                throw new Error("Sign-in completed without an active session.");
            }

            await get().loadUser(`neon:${sessionUser.id}`);
            let state = get();
            if (!state.isAuthenticated && state.status === "unauthenticated") {
                const linked = await authService.linkNeonIdentity(legacyPassword ?? data.password);
                if (linked) {
                    await get().loadUser(`neon:${sessionUser.id}`);
                    state = get();
                } else if (legacyPassword) {
                    throw new Error("That password did not match your previous Qubira account.");
                } else {
                    throw new LegacyAccountPasswordRequiredError();
                }
            }
            if (!state.isAuthenticated || !state.user) {
                throw new Error(state.authError ?? "Unable to load your Qubira account.");
            }
            return state.user;
        } catch (error) {
            set({ loading: false, isAuthenticated: false, status: "unauthenticated", authError: errorMessage(error) });
            throw error;
        }
    },

    async logout() {
        authRequestGeneration += 1;
        activeAuthSessionKey = null;
        activeLoadUser = null;
        const result = await authClient.signOut();
        if (result.error) {
            throw new Error(result.error.message);
        }
        cacheUser(null);
        if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
        }
        if (typeof window !== "undefined") {
            try { useDashboardStore.getState().reset(); } catch {} 
        }
        set({ user: null, loading: false, isAuthenticated: false, status: "unauthenticated", authError: null });
    },

    async loadUser(sessionKey) {
        const requestedSessionKey = sessionKey ?? activeAuthSessionKey ?? "legacy";
        if (activeLoadUser?.sessionKey === requestedSessionKey) return activeLoadUser.promise;

        if (activeAuthSessionKey && activeAuthSessionKey !== requestedSessionKey) {
            authRequestGeneration += 1;
            activeLoadUser = null;
            cacheUser(null);
            if (typeof window !== "undefined") {
            try { useDashboardStore.getState().reset(); } catch {} 
        }
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
        if (typeof window !== "undefined") {
            try { useDashboardStore.getState().reset(); } catch {} 
        }
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
