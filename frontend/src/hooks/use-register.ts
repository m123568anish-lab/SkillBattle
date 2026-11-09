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

            if (sessionResult.data?.user) {
                await useAuthStore.getState().logout();
            } else {
                useAuthStore.getState().clearSession();
            }
        } finally {
            setLoading(false);
        }


    }

    return {

        loading,

        signUp,

    };

}