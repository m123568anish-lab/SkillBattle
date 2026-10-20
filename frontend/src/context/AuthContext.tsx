"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";

import { useAuthStore } from "../store/authStore";
import { configureClerkTokenProvider } from "@/lib/api";
import {
    AUTH_BOOTSTRAP_TIMEOUT_MS,
    getAuthBootstrapDecision,
} from "@/lib/auth-bootstrap";

interface AuthContextType {
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    loading: true,
});

export function AuthProvider({

    children,

}:{

    children: ReactNode;

}) {
    const [clerkTimedOut, setClerkTimedOut] = useState(false);
    const [authAttempt, setAuthAttempt] = useState(0);
    const {
        isLoaded: clerkLoaded,
        isSignedIn,
        getToken,
        userId,
    } = useClerkAuth();

    const {

        loading,

        loadUser,

    } = useAuthStore();

    useEffect(() => {
        if (clerkLoaded) {
            setClerkTimedOut(false);
            return;
        }

        const timeout = window.setTimeout(
            () => setClerkTimedOut(true),
            AUTH_BOOTSTRAP_TIMEOUT_MS,
        );
        return () => window.clearTimeout(timeout);
    }, [authAttempt, clerkLoaded]);

    useEffect(() => {
        const retry = () => {
            setClerkTimedOut(false);
            setAuthAttempt((attempt) => attempt + 1);
        };
        window.addEventListener("skillbattle:retry-auth", retry);
        return () => window.removeEventListener("skillbattle:retry-auth", retry);
    }, []);

    useEffect(() => {
        configureClerkTokenProvider(
            isSignedIn ? getToken : null,
            isSignedIn === true,
        );

        return () => configureClerkTokenProvider(null, false);
    }, [getToken, isSignedIn]);

    useEffect(() => {
            const hasLegacyToken = Boolean(localStorage.getItem("access_token"));
            const decision = getAuthBootstrapDecision({
                clerkLoaded,
                isSignedIn: isSignedIn === true,
                hasLegacyToken,
                timedOut: clerkTimedOut,
            });

            if (decision === "pending") {
                useAuthStore.setState({ loading: true, status: "loading" });
                return;
            }

            if (decision === "resolve-session") {
                void loadUser(isSignedIn ? `clerk:${userId ?? "active"}` : "legacy");
            } else if (decision === "anonymous") {
                useAuthStore.getState().clearSession();
            } else {
                useAuthStore.getState().markUnavailable(
                    "Authentication could not be initialized. Check your connection and try again.",
                );
            }
        }, [clerkLoaded, clerkTimedOut, isSignedIn, userId, loadUser]);

    useEffect(() => {
        const invalidate = () => useAuthStore.getState().clearSession("Your session has expired. Please sign in again.");
        window.addEventListener("skillbattle:session-invalid", invalidate);
        return () => window.removeEventListener("skillbattle:session-invalid", invalidate);
    }, []);

    return (

        <AuthContext.Provider
            value={{
                loading,
            }}
        >

            {children}

        </AuthContext.Provider>

    );

}

export function useAuthContext() {

    return useContext(AuthContext);

}
