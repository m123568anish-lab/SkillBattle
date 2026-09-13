"use client";

import { useState } from "react";
import { authService } from "@/services/auth.service";

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

            const payload = {

                username: data.email.split("@")[0],

                full_name: data.name,

                email: data.email,

                password: data.password,

                avatar_url: data.avatar,

            };

            console.log("Register Payload:", payload);

            const user = await authService.register(payload);

            try {
                await authService.login({
                    email: data.email,
                    password: data.password,
                });
            } catch (loginErr) {
                console.warn("Auto-login post-registration warning:", loginErr);
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