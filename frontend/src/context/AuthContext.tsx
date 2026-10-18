"use client";

import {
    createContext,
    useContext,
    useEffect,
    ReactNode,
} from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";

import { useAuthStore } from "../store/authStore";
import { configureClerkTokenProvider } from "@/lib/api";

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
        configureClerkTokenProvider(
            isSignedIn ? getToken : null,
            isSignedIn === true,
        );

        return () => configureClerkTokenProvider(null, false);
    }, [getToken, isSignedIn]);

    useEffect(() => {
            if (!clerkLoaded) {
                useAuthStore.setState({ loading: true, status: "loading" });
                return;
            }

            const token = localStorage.getItem("access_token");

            if (isSignedIn || token) {
                void loadUser(isSignedIn ? `clerk:${userId ?? "active"}` : "legacy");
            } else {
                useAuthStore.getState().clearSession();
            }
        }, [clerkLoaded, isSignedIn, userId, loadUser]);

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
