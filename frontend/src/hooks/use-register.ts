"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { authClient } from "@/lib/auth/client";
import type { RegisterFormData } from "@/lib/validation";

export function useRegister() {

    const [loading, setLoading] = useState(false);

    async function signUp(data: RegisterFormData) {

        setLoading(true);

        try {
            const result = await authClient.signUp.email({
                name: data.name,
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

            const neonUser = sessionResult.data?.user;
            if (!neonUser) {
                return { authenticatedUser: null, profilePending: false };
            }

            await useAuthStore.getState().loadUser(`neon:${neonUser.id}`);
            const state = useAuthStore.getState();
            if (!state.isAuthenticated || !state.user) {
                return { authenticatedUser: null, profilePending: true };
            }
            return { authenticatedUser: state.user, profilePending: false };
        } finally {
            setLoading(false);
        }


    }

    return {

        loading,

        signUp,

    };

}