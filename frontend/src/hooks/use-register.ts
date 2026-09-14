"use client";

import { useState } from "react";
import { authService } from "@/services/auth.service";
import type { RegisterRequest } from "@/types/auth";

interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    avatar: string;
}

export function useRegister() {

    const [loading, setLoading] = useState(false);

    async function signUp(data: RegisterFormData) {

        setLoading(true);

        try {

            const emailPrefix = data.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") || "player";
            const username = (emailPrefix.length >= 3 ? emailPrefix : `${emailPrefix}_usr`).slice(0, 30);

            const payload: RegisterRequest = {

                username,

                full_name: data.name,

                email: data.email,

                password: data.password,

                avatar_url: data.avatar,

            };

            const user = await authService.register(payload);

            try {
                await authService.login({
                    email: data.email,
                    password: data.password,
                });
            } catch (loginErr) {
                // Auto-login fallback if user registration succeeds but immediate login requires verification
            }

            return user;
        } finally {
            setLoading(false);
        }


    }

    return {

        loading,

        signUp,

    };

}