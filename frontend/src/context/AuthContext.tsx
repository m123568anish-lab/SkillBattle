"use client";

import {
    createContext,
    useContext,
    useEffect,
    ReactNode,
} from "react";

import { useAuthStore } from "../store/authStore";
import { configureNeonTokenProvider } from "@/lib/api";
import { authClient } from "@/lib/auth/client";

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
    const { data: session, isPending, error } = authClient.useSession();
    const loading = useAuthStore((state) => state.loading);
    const loadUser = useAuthStore((state) => state.loadUser);

    useEffect(() => {
        configureNeonTokenProvider(async () => {
            // Bypass the cached session response because it omits Neon Auth's access-token header.
            const sessionResult = await authClient.getSession({
                query: { disableCookieCache: true },
                fetchOptions: { headers: { "X-Force-Fetch": "true" } },
            });
            if (sessionResult.error) {
                throw new Error(sessionResult.error.message);
            }
            const session = sessionResult.data?.session;
            if (!session) {
                return null;
            }
            if (typeof session.token !== "string" || session.token.split(".").length !== 3) {
                throw new Error("Neon Auth session did not provide an API access token.");
            }
            return session.token;
        });

        return () => configureNeonTokenProvider(null);
    }, []);

    useEffect(() => {
        if (isPending) {
            useAuthStore.setState({ loading: true, status: "loading" });
            return;
        }

        if (error) {
            useAuthStore.getState().markUnavailable(
                "Authentication could not be initialized. Check your connection and try again.",
            );
            return;
        }

        if (session?.user) {
            void loadUser(`neon:${session.user.id}`).then(() => {
                const currentUser = useAuthStore.getState().user;
                const oauthImage = (session?.user as any)?.image;
                if (oauthImage && currentUser && !currentUser.avatar_url) {
                    useAuthStore.getState().updateUserPartial({ avatar_url: oauthImage });
                }
            });
        } else {
            useAuthStore.getState().clearSession();
        }
    }, [error, isPending, loadUser, session?.user?.id]);

    useEffect(() => {
        const invalidate = () => {
            void authClient.getSession().then(({ data, error: sessionError }) => {
                if (sessionError) {
                    useAuthStore.getState().markUnavailable(
                        "Authentication could not be initialized. Check your connection and try again.",
                    );
                } else if (data?.user) {
                    void loadUser(`neon:${data.user.id}`).then(() => {
                        const currentUser = useAuthStore.getState().user;
                        const oauthImage = (data?.user as any)?.image;
                        if (oauthImage && currentUser && !currentUser.avatar_url) {
                            useAuthStore.getState().updateUserPartial({ avatar_url: oauthImage });
                        }
                    });
                } else {
                    useAuthStore.getState().clearSession(
                        "Your session has expired. Please sign in again.",
                    );
                }
            }).catch(() => {
                useAuthStore.getState().markUnavailable(
                    "Authentication could not be initialized. Check your connection and try again.",
                );
            });
        };
        window.addEventListener("skillbattle:retry-auth", invalidate);
        window.addEventListener("skillbattle:session-invalid", invalidate);
        return () => {
            window.removeEventListener("skillbattle:retry-auth", invalidate);
            window.removeEventListener("skillbattle:session-invalid", invalidate);
        };
    }, [loadUser]);

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
